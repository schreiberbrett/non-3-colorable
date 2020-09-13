import type { Maybe } from './Maybe'
import { nothing, just } from './Maybe'

export type Color = 'red' | 'green' | 'blue'

type CycleTangent = {
    memberOfCycle: number
    neighbor: number
}

type Proof = {
    assumptionProofs: AssumptionProof[]
    noAssumptionsProof: NoAssumptionsProof
}

type AssumptionProof = {
    initialStep: AssumptionInitialStep
    intermediateSteps: IntermediateStep[]
    contradictoryEdge: [number, number]
}

export type NoAssumptionsProof = {
    initialRedGreenEdge: [number, number]
    intermediateSteps: IntermediateStep[]
    contradictoryEdge: [number, number]
    finalColors: Map<number, Color>
}

type AssumptionInitialStep = AssumeSameColors | AssumeDifferentColors

export type IntermediateStep = TwoNeighborsTwoColors | OddCycleTangentsSameColor

type TwoNeighborsTwoColors = {
    name: 'TwoNeighborsTwoColors'
    newColor: Color
    vertex: number
    colors: Map<number, Color>
    firstNeighbor: number
    secondNeighbor: number
}

type OddCycleTangentsSameColor = {
    name: 'OddCycleTangentsSameColor'
    newColor: Color
    vertex: number
    colors: Map<number, Color>
    oddCycleTangents: CycleTangent[]
}

type AssumeSameColors = {
    name: 'AssumeSameColors'
    firstRedVertex: number
    secondRedVertex: number
}

type AssumeDifferentColors = {
    name: 'AssumeDifferentColors'
    redVertex: number
    greenVertex: number
}

export function findNoAssumptionsProof(vertices: number[], edges: [number, number][]): Maybe<NoAssumptionsProof> {
    const {hasEdge, neighbors} = make(vertices, edges)
    
    for (let [a, b] of edges) {
        let colors = new Map<number, Color>([[a, 'red'], [b, 'green']])
        let intermediateSteps: IntermediateStep[] = []

        while (true) {
            const maybeIntermediateStep = findIntermediateStep(vertices, hasEdge, colors, neighbors)
            if (maybeIntermediateStep.name === 'Nothing') {
                break
            }

            intermediateSteps.push(maybeIntermediateStep.value)
            colors.set(maybeIntermediateStep.value.vertex, maybeIntermediateStep.value.newColor)

            const maybeContradictoryEdge = find(edges, ([u, v]) =>
                colors.has(u) && colors.has(v) &&
                (colors.get(u) === colors.get(v))
            )

            if (maybeContradictoryEdge.name === 'Just') {
                return just({
                    initialRedGreenEdge: [a, b],
                    intermediateSteps,
                    contradictoryEdge: maybeContradictoryEdge.value,
                    finalColors: new Map(colors)
                })
            }
        }
    }

    return nothing()
}

function findIntermediateStep(vertices: number[], hasEdge: Map<number, Set<number>>, colors: Map<number, Color>, neighbors: Map<number, number[]>): Maybe<IntermediateStep> {
    const maybeTwoNeighborsTwoColors = findTwoNeighborsTwoColors(vertices, colors, neighbors)
    if (maybeTwoNeighborsTwoColors.name === 'Just') {
        return maybeTwoNeighborsTwoColors
    }

    return findOddCycleTangentsSameColors(vertices, hasEdge, colors, neighbors)
}

function findTwoNeighborsTwoColors(vertices: number[], colors: Map<number, Color>, neighbors: Map<number, number[]>): Maybe<TwoNeighborsTwoColors> {
    for (let vertex of vertices.filter(vertex => !colors.has(vertex))) {
        let redNeighbor: Maybe<number> = nothing()
        let greenNeighbor: Maybe<number> = nothing()
        let blueNeighbor: Maybe<number> = nothing()

        for (let neighbor of neighbors.get(vertex)) {
            if (colors.has(neighbor)) {
                switch (colors.get(neighbor)) {
                    case 'red':
                        redNeighbor = just(neighbor)
                        break

                    case 'green':
                        greenNeighbor = just(neighbor)
                        break

                    case 'blue':
                        blueNeighbor = just(neighbor)
                        break
                }

                if (redNeighbor.name === 'Just' && greenNeighbor.name === 'Just') {
                    return just({
                        name: 'TwoNeighborsTwoColors',
                        newColor: 'blue',
                        vertex: vertex,
                        firstNeighbor: redNeighbor.value,
                        secondNeighbor: greenNeighbor.value,
                        colors: new Map(colors)
                    })
                }

                if (redNeighbor.name === 'Just' && blueNeighbor.name === 'Just') {
                    return just({
                        name: 'TwoNeighborsTwoColors',
                        newColor: 'green',
                        vertex: vertex,
                        firstNeighbor: redNeighbor.value,
                        secondNeighbor: blueNeighbor.value,
                        colors: new Map(colors)
                    })
                }

                if (greenNeighbor.name === 'Just' && blueNeighbor.name === 'Just') {
                    return just({
                        name: 'TwoNeighborsTwoColors',
                        newColor: 'red',
                        vertex: vertex,
                        firstNeighbor: blueNeighbor.value,
                        secondNeighbor: greenNeighbor.value,
                        colors: new Map(colors)
                    })
                }
            }
        }
    }

    return nothing()
}

function findCycles(cycleLength: number, vertices: number[], hasEdge: Map<number, Set<number>>): number[][] {
    return findPaths(cycleLength, vertices, hasEdge)
        .filter(path => hasEdge.get(path[0]).has(path[cycleLength - 1]))
}

function findPaths(pathLength: number, vertices: number[], hasEdge: Map<number, Set<number>>): number[][] {
    return flatMap(vertices, vertex => helper([], vertex))

    function helper(pathSoFar: number[], lastInPath: number): number[][] {
        const fullPath = [...pathSoFar, lastInPath]

        if (fullPath.length === pathLength) {
            return [fullPath]
        }

        const candidateVertices = vertices.filter(vertex => !pathSoFar.includes(vertex) && hasEdge.get(lastInPath).has(vertex))
        
        if (candidateVertices.length === 0) {
            return []
        }

        return flatMap(candidateVertices, vertex => helper(fullPath, vertex))
    }
}

function findOddCycleTangentsSameColors(vertices: number[], hasEdge: Map<number, Set<number>>, colors: Map<number, Color>, neighbors: Map<number, number[]>): Maybe<OddCycleTangentsSameColor> {
    for (let i = 3; i < vertices.length; i += 2) {
        for (let oddCycle of findCycles(i, vertices, hasEdge)) {
            const redResult = analyzeOddCycle(oddCycle, neighbors, 'red', colors)
            if (redResult.name === 'Just') {
                return redResult
            }

            const greenResult = analyzeOddCycle(oddCycle, neighbors, 'green', colors)
            if (greenResult.name === 'Just') {
                return greenResult
            }

            const blueResult = analyzeOddCycle(oddCycle, neighbors, 'blue', colors)
            if (blueResult.name === 'Just') {
                return blueResult
            }
        }
    }

    return nothing()
}

function analyzeOddCycle(oddCycle: number[], neighbors: Map<number, number[]>, color: Color, colors: Map<number, Color>): Maybe<OddCycleTangentsSameColor> {
    let exception: Maybe<number> = nothing()
    let oddCycleTangents: CycleTangent[] = []


    for (let vertex of oddCycle) {
        const maybeNeighbor = find(neighbors.get(vertex), neighbor => colors.get(neighbor) === color)

        if (maybeNeighbor.name === 'Just') {
            oddCycleTangents.push({memberOfCycle: vertex, neighbor: maybeNeighbor.value})
        } else {
            if (exception.name === 'Just' || colors.has(vertex)) {
                return nothing()
            } else {
                exception = just(vertex)
            }
        }
    }

    switch (exception.name) {
        case 'Just':
            return just({
                name: 'OddCycleTangentsSameColor',
                newColor: color,
                vertex: exception.value,
                oddCycleTangents,
                colors: new Map(colors)
            })

        case 'Nothing':
            const [first, ...rest] = oddCycleTangents
            return just({
                name: 'OddCycleTangentsSameColor',
                newColor: color,
                vertex: first.memberOfCycle,
                oddCycleTangents: rest,
                colors: new Map(colors)
            })
    }
}


function find<T>(xs: T[], predicate: (x: T) => boolean): Maybe<T> {
    for (let x of xs) {
        if (predicate(x)) {
            return just(x)
        }
    }

    return nothing()
}

function flatMap<A, B>(xs: A[], f: (x: A) => B[]): B[] {
    let result: B[] = []
    for (let x of xs) {
        result.push(...f(x))
    }

    return result
}


export function make(vertices: number[], edges: [number, number][]): {hasEdge: Map<number, Set<number>>, neighbors: Map<number, number[]>} {
    let hasEdge: Map<number, Set<number>> = new Map()
    let neighbors: Map<number, number[]> = new Map()

    for (let vertex of vertices) {
        hasEdge.set(vertex, new Set())
        neighbors.set(vertex, [])
    }

    for (let [a, b] of edges) {
        hasEdge.get(a).add(b)
        hasEdge.get(b).add(a)

        neighbors.get(a).push(b)
        neighbors.get(b).push(a)
    }

    return {hasEdge, neighbors}
}