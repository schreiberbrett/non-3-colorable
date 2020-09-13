<script lang="ts">
    import type { NoAssumptionsProof, IntermediateStep } from './Proof'

    export let noAssumptionsProof: NoAssumptionsProof
    export let vertices: number[]
    export let edges: [number, number][]
    export let xs: number[]
    export let ys: number[]

    let state: 'First' | 'Middle' | 'Last' = 'First'

    let index = -1

    function isContradictoryEdge(u: number, v: number, noAssumptionsProof: NoAssumptionsProof): boolean {
		const [a, b] = noAssumptionsProof.contradictoryEdge
		return (
			(u === a && v === b) ||
			(u === b && v === a)
		)
    }

    function equalEdges([u, v]: [number, number], [a, b]: [number, number]): boolean {
        return (u === a && v === b) || (u === b && v === a)
    }

    function intermediateStrokeColor(u: number, v: number, intermediateStep: IntermediateStep): string {
        if (intermediateStep.name === 'TwoNeighborsTwoColors') {
            if (equalEdges([u, v], [intermediateStep.firstNeighbor, intermediateStep.vertex])) {
                return intermediateStep.colors.get(intermediateStep.firstNeighbor)
            } else if (equalEdges([u, v], [intermediateStep.secondNeighbor, intermediateStep.vertex])) {
                return intermediateStep.colors.get(intermediateStep.secondNeighbor)
            } else {
                return 'black'
            }
        }
    }
</script>

{#if state === 'First'}
    <svg>
        {#each edges as [a, b]}
            <line stroke="black" x1={xs[a]} x2={xs[b]} y1={ys[a]} y2={ys[b]}></line>
        {/each}

        {#each vertices as vertex}
            <g class="vertex">
                <circle fill={
                    vertex === noAssumptionsProof.initialRedGreenEdge[0] ? 'red' :
                    vertex === noAssumptionsProof.initialRedGreenEdge[1] ? 'green' :
                    'white'
                } stroke="black" r="20" cx={xs[vertex]} cy={ys[vertex]} />
                <text stroke="black" x={xs[vertex]} y={ys[vertex]} text-anchor="middle" font-size="smaller">{vertex}</text>
            </g>
        {/each}
    </svg>


    <button disabled>Previous Step</button>

    <button on:click={_ => {
        state = 'Middle'
        index = 0
    }}>Next Step</button>
{/if}

{#if state === 'Middle'}
    <svg>
        {#each edges as [a, b]}
            <line stroke={intermediateStrokeColor(a, b, noAssumptionsProof.intermediateSteps[index])} x1={xs[a]} x2={xs[b]} y1={ys[a]} y2={ys[b]}></line>
        {/each}

        {#each vertices as vertex}
            {#if vertex === noAssumptionsProof.intermediateSteps[index].vertex}
                <g class="vertex">
                    <circle fill={noAssumptionsProof.intermediateSteps[index].newColor} stroke="black" r="20" cx={xs[vertex]} cy={ys[vertex]} />
                    <text stroke="black" x={xs[vertex]} y={ys[vertex]} text-anchor="middle" font-size="smaller">{vertex}</text>
                </g>
            {:else}
                <g class="vertex">
                    <circle fill={noAssumptionsProof.intermediateSteps[index].colors.has(vertex) ? noAssumptionsProof.intermediateSteps[index].colors.get(vertex) : 'white'} stroke="black" r="20" cx={xs[vertex]} cy={ys[vertex]} />
                    <text stroke="black" x={xs[vertex]} y={ys[vertex]} text-anchor="middle" font-size="smaller">{vertex}</text>
                </g>
            {/if}
        {/each}
    </svg>

    <button on:click={_ => {
        if (index === 0) {
            index = -1
            state = 'First'
        } else {
            index = index - 1
        }
    }}>Previous Step</button>

    <button on:click={_ => {
        if (index === noAssumptionsProof.intermediateSteps.length - 1) {
            index = -1
            state = 'Last'
        } else {
            index = index + 1
        }
    }}>Next Step</button>
{/if}

{#if state === 'Last'}
    <svg>
        {#each edges as [a, b]}
            <line
                stroke={isContradictoryEdge(a, b, noAssumptionsProof) ? 'red' : 'black'}
                stroke-width={isContradictoryEdge(a, b, noAssumptionsProof) ? 3 : 1}
                x1={xs[a]} x2={xs[b]} y1={ys[a]} y2={ys[b]}
            />
        {/each}

        {#each vertices as vertex}
            <g class="vertex">
                <circle fill={noAssumptionsProof.finalColors.has(vertex) ? noAssumptionsProof.finalColors.get(vertex) : 'white' } stroke="black" r="20" cx={xs[vertex]} cy={ys[vertex]} />
                <text stroke="black" x={xs[vertex]} y={ys[vertex]} text-anchor="middle" font-size="smaller">{vertex}</text>
            </g>
        {/each}
    </svg>

    <button on:click={_ => {
        index = noAssumptionsProof.intermediateSteps.length - 1
        state = 'Middle'
    }}>Previous Step</button>

    <button disabled>Next Step</button>
{/if}


<style>
    svg {
        display: block;
        height: 700px;
        width: 700px;
    }
</style>