import type { Transport } from 'mediasoup-client/types';

export const createProducer = async (localStream: MediaStream, producerTransport: Transport) => {
	if (!localStream) {
		throw new Error('Local stream is not available');
	}
	if (!producerTransport) {
		throw new Error('Producer transport is not available');
	}

	const audioTrack = localStream.getAudioTracks()[0];
	if (!audioTrack) {
		throw new Error('No audio track found in local stream');
	}
	console.log('test tone track:', {
		id: audioTrack.id,
		kind: audioTrack.kind,
		enabled: audioTrack.enabled,
		muted: audioTrack.muted,
		readyState: audioTrack.readyState
	});
	try {
		console.log('Creating producer with test tone audio track');
		// console.log('Creating producer with audio track:');
		const audioProducer = await producerTransport.produce({ track: audioTrack });
		console.log('Producer created:', audioProducer);
		return audioProducer;
	} catch (err) {
		console.error('Error creating producer:', err);
	}
};
