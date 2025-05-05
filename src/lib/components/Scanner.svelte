<script lang="ts">
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import { Scan, SwitchCamera } from 'lucide-svelte';
	import QrScanner from 'qr-scanner';
	import { onDestroy, onMount } from 'svelte';
	import { URDecoder } from '@gandlaf21/bc-ur';
    import Button from './ui/button/button.svelte';
    import Textarea from './ui/textarea/textarea.svelte';
	import {  bytesToHex } from "@noble/hashes/utils";
    import { downloadTextAsFile } from './dl';

	let videoElem: HTMLVideoElement | undefined = $state();
	let qrScanner: QrScanner | undefined = $state();
	let cams: QrScanner.Camera[] | undefined = $state();

	let facingMode: QrScanner.FacingMode = 'environment';

	let completion = $state(0);

	let scanProcess = '';

	let decoder: URDecoder;

	let scanned = $state("");

	onMount(async () => {
		decoder = new URDecoder();

		if (await QrScanner.hasCamera()) {
			if (!videoElem) {
				console.error('video element not present');
				return;
			}
			qrScanner = new QrScanner(
				videoElem,
				(result) => {
					onScanSuccess(result);
				},
				{
					/* your options or returnDetailedScanResult: true if you're not specifying any other options */
				}
			);
			qrScanner.start();
			cams = await QrScanner.listCameras(true);
			if (cams.length > 1) {
				qrScanner.setCamera(facingMode);
			}
		} else {
			cams = [];
		}
	});

	onDestroy(() => {
		if (qrScanner) {
			qrScanner.destroy();
		}
	});

	const onScanSuccess = (result: QrScanner.ScanResult) => {
		if (!result.data.startsWith('ur:')
		) {
			return;
		} 
			const chunkProcess = result.data.split('/')[1].split('-')[1];
			if (scanProcess && scanProcess !== chunkProcess) {
				decoder = new URDecoder();
			}
			scanProcess = chunkProcess;
			decoder.receivePart(result.data);
			completion = Math.floor(decoder.estimatedPercentComplete() * 100);
			if (!decoder.isComplete()) {
				return;
			}
			if (!decoder.isSuccess()) {
				throw new Error(`${decoder.resultError()}`);
			}
			const ur = decoder.resultUR();
			const decoded = ur.decodeCBOR();
			const scannedToken = bytesToHex(decoded);
			scanComplete(scannedToken);
	};


	const scanComplete = (token: string) => {
		scanned = token
	};



</script>

<div class="flex min-h-96 w-full flex-col items-center justify-center">
{#if !scanned}
  
	<p>Scan a PSBT</p>
	<div class="h-10 w-80 xl:w-[600px]">
		{#if cams?.length && completion}
			<Progress value={completion - 5} max={100} class="w-full" />
		{/if}
	</div>
	<div class="relative flex h-full w-80 items-center justify-center xl:w-[600px]">
		<div class="video-wrapper h-80 w-80 rounded-lg border bg-black p-2 xl:w-[600px]">
			{#if cams === undefined}
				Loading cam
			{:else if cams?.length === 0}
				cam not found
			{/if}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={videoElem} width="100%" height="auto" class="video-container"> </video>
		</div>

		<div class="absolute right-5 top-5 z-10 h-10 w-10">
			{#if (cams?.length ?? 0) > 1}
				<button
					class=""
					onclick={async () => {
						await qrScanner?.setCamera(facingMode);
						qrScanner?.stop();
						qrScanner?.start();
					}}
				>
					<SwitchCamera></SwitchCamera>
				</button>
			{/if}
		</div>

		<div class="absolute z-10 h-56 w-56 opacity-30">
			<Scan color="rgb(219 39 119)" size={220} strokeWidth={1}></Scan>
		</div>
	</div>
	
	
	{:else}
	<div class="flex gap-2 flex-col w-80 xl:w-[600px]">
		<Textarea bind:value={scanned} placeholder="Type your message here." />
		
		<Button onclick={()=> {
			downloadTextAsFile(scanned, 'psbt.psbt')
		}}>
			Download file
		</Button>

		<Button variant='outline' onclick={()=>scanned=""}>
			scan again
		</Button>
	</div>
	{/if}
</div>
	
	
	<style>
		.video-container {
		object-fit: cover;
		height: 100%;
		width: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}
	.video-wrapper {
		/* Telling our absolute positioned video to 
  be relative to this element */
		position: relative;

		/* Will not allow the video to overflow the 
  container */
		overflow: hidden;

		/* Centering the container's content vertically 
  and horizontally */
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
