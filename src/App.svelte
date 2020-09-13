<script lang="ts">
import type { get } from 'svelte/store';
	import type { Maybe } from './Maybe'
	import { nothing } from './Maybe';
	import type { NoAssumptionsProof } from './Proof'
	import { findNoAssumptionsProof } from './Proof'

	import NoAssumptionsProofView from './NoAssumptionsProofView.svelte'

	type State = {
		name: 'Neutral'
	} | {
		name: 'Hover'
		vertex: number
	} | {
		name: 'Dragging'
		vertex: number
		cursorX: number
		cursorY: number
	} | {
		name: 'MakingEdge'
		source: number
		cursorX: number
		cursorY: number
	} | {
		name: 'SnappedEdge'
		source: number
		destination: number
	}

	let state: State = {name: 'Neutral'}

	let vertices: number[] = []
	let edges: [number, number][] = []
	let xs: number[] = []
	let ys: number[] = []

	let unusedVertices: number[] = []

	let noAssumptionsProof: Maybe<NoAssumptionsProof> = nothing()

	function cursorPosition(event: MouseEvent): {cursorX: number, cursorY: number} {
		const svg = event.target as SVGGraphicsElement
		const CTM = svg.getScreenCTM()

		const cursorX = (event.clientX - CTM.e) / CTM.a
		const cursorY = (event.clientY - CTM.f) / CTM.d

		return {cursorX, cursorY}
	}

	function edgeExists(u: number, v: number) {
		return edges.some(([a, b]) => (a === u && b === v) || (a === v && b === u))
	}
</script>

<main>
	<svg
		on:mousemove={event => {
			if (state.name === 'Dragging') {
				const { cursorX, cursorY } = cursorPosition(event)
				xs[state.vertex] = cursorX
				ys[state.vertex] = cursorY
				state = { name: 'Dragging', vertex: state.vertex, ...cursorPosition(event)	}		
			} else if (state.name === 'MakingEdge') {
				state = { name: 'MakingEdge', source: state.source, ...cursorPosition(event) }
			}
		}}
		on:mouseup={event => {
			if (state.name === 'Neutral') {
				const vertex = unusedVertices.length === 0 ? vertices.length : unusedVertices.pop()
				const { cursorX, cursorY } = cursorPosition(event)
				vertices = [...vertices, vertex]
				xs[vertex] = cursorX
				ys[vertex] = cursorY
			} else if (state.name === 'MakingEdge') {
				state = { name: 'Neutral' }
			} else if (state.name === 'SnappedEdge') {
				edges = [...edges, [state.source, state.destination]]
				state = { name: 'Hover', vertex: state.destination }
			}
		}}
		on:auxclick|preventDefault
		on:contextmenu|preventDefault
	>
		{#each edges as [a, b]}
			<line class="edge" stroke="black"
				x1={xs[a]} y1={ys[a]}
				x2={xs[b]} y2={ys[b]}
			/>
		{/each}

		{#each vertices as vertex}
			<circle	class="snappable-area" cx={xs[vertex]} cy={ys[vertex]} r="40" fill="none"
				on:mouseover={_ => {
					if (state.name === 'MakingEdge' && vertex !== state.source && !edgeExists(vertex, state.source)) {
						state = { name: 'SnappedEdge', source: state.source, destination: vertex }
					}
				}}

				on:mouseleave={event => {
					if (state.name === 'SnappedEdge') {
						state = { name: 'MakingEdge', source: state.source, ...cursorPosition(event) }
					}
				}}

				on:click={_ => {
					if (state.name === 'SnappedEdge') {
						edges = [...edges, [state.source, state.destination]]
						state = { name: 'Neutral' }
					}
				}}
			/>

			<g
				on:mouseover={_ => {
					if (state.name === 'Neutral') {
						state = { name: 'Hover', vertex	}
					} else if (state.name === 'MakingEdge' && vertex !== state.source && !edgeExists(vertex, state.source)) {
						state = { name: 'SnappedEdge', source: state.source, destination: vertex }
					}
				}}

				on:mouseleave={event => {
					if (state.name === 'Hover') {
						state = { name: 'Neutral' }
					} else if (state.name === 'SnappedEdge') {
						state = { name: 'MakingEdge', source: state.source, ...cursorPosition(event) }
					}
				}}

				on:mousedown={event => {
					if (state.name === 'Hover') {
						const { cursorX, cursorY } = cursorPosition(event)
						state = { name: 'Dragging', vertex: state.vertex, cursorX, cursorY }
					}
				}}

				on:mouseup={_ => {
					if (state.name === 'Dragging') {
						state = { name: 'Hover', vertex: state.vertex }
					} else if (state.name === 'MakingEdge') {
						state = { name: 'Hover', vertex: state.source }
					} else if (state.name === 'SnappedEdge') {
						edges = [...edges, [state.source, state.destination]]
						state = { name: 'Hover', vertex: state.destination }
					}
				}}

				on:mousemove={event => {
					if (state.name === 'Dragging') {
						const { cursorX, cursorY } = cursorPosition(event)
						xs[vertex] = cursorX
						ys[vertex] = cursorY
						state = { name: 'Dragging', vertex: state.vertex, cursorX, cursorY }		
					}
				}}

				on:dblclick={event => {
					if (state.name === 'Hover') {
						state = {
							name: 'MakingEdge',
							source: vertex,
							cursorX: xs[vertex],
							cursorY: ys[vertex]
						}
					}
				}}

				on:auxclick|preventDefault={event => {
					if (state.name === 'Hover') {
						vertices = vertices.filter(v => v !== vertex)
						edges = edges.filter(([a, b]) => a !== vertex && b !== vertex)

						unusedVertices.push(vertex)

						state = { name: 'Neutral' }
					}
				}}

				on:contextmenu|preventDefault
			>
				<circle
					class={
						(state.name === 'Hover' || state.name === 'Dragging') && state.vertex === vertex
							? (state.name === 'Hover' ? 'hovering' : 'dragging')
							: 'neutral'
					}
					cx={xs[vertex]}	cy={ys[vertex]}	r="20" fill="white"	stroke="black"
				/>

				<text
					class={
						(state.name === 'Hover' || state.name === 'Dragging') && state.vertex === vertex
							? (state.name === 'Hover' ? 'hovering' : 'dragging')
							: 'neutral'
					}
					text-anchor="middle" font-size="smaller" x={xs[vertex]}	y={ys[vertex]}
				>{vertex}</text>
			</g>
		{/each}

		{#if state.name === 'MakingEdge'}
			<line
				class="preview-line"
				stroke="black"

				x1={xs[state.source]}
				y1={ys[state.source]}

				x2={state.cursorX}
				y2={state.cursorY}
			/>
		{/if}

		{#if state.name === 'SnappedEdge'}
			<line
				class="preview-line"
				stroke="black"

				x1={xs[state.source]}
				y1={ys[state.source]}


				x2={xs[state.destination]}
				y2={ys[state.destination]}
			/>
		{/if}
	</svg>

	<button on:click={_ => { noAssumptionsProof = findNoAssumptionsProof(vertices, edges) }}>Analyze Colorability</button>

	{#if noAssumptionsProof.name === 'Just'}
		<NoAssumptionsProofView {vertices} {edges} noAssumptionsProof={noAssumptionsProof.value} {xs} {ys} />
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	svg {
		display: block;
		border: 1px solid black;
		height: 700px;
		width: 700px;
	}

	text {
		pointer-events: none;
	}

	.hovering {
    	cursor: grab;
	}

	.dragging {
		cursor: grabbing;
	}

	.snappable-area {
		pointer-events: all;
	}

	.preview-line {
		pointer-events: none;
	}

	.edge {
		cursor: pointer;
	}
</style>