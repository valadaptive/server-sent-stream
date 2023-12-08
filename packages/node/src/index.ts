import {Transform} from 'stream';
import EventStreamParser from '@server-sent-stream/parser';
import {StringDecoder} from 'string_decoder';

/**
 * Node-style transform stream which turns a stream of {@link Buffer}s or {@link Uint8Array}s into a stream of
 * {@link MessageEvent}s.
 */
class EventSourceStream extends Transform {
    private parser: EventStreamParser;
    private decoder: StringDecoder;
    private isFirstChunk: boolean;
    constructor() {
        // The readable end is a stream of ServerSentEvents
        super({readableObjectMode: true});
        this.parser = new EventStreamParser((data, eventType, lastEventId) => {
            this.push(new MessageEvent(eventType, {data, lastEventId}));
        });
        this.decoder = new StringDecoder('utf-8');
        this.isFirstChunk = true;
    }

    _transform(chunk: Buffer | Uint8Array, encoding: string, callback: (error: Error | null) => unknown) {
        try {
            // The StringDecoder actually accepts buffers *and* typed arrays, but TypeScript doesn't know that
            let decoded = this.decoder.write(chunk as Buffer);
            // Strip the Unicode byte-order mark
            if (this.isFirstChunk && decoded[0] === '\ufeff') {
                decoded = decoded.slice(1);
            }
            this.parser.push(decoded);
            this.isFirstChunk = false;
            callback(null);
        } catch (err) {
            callback(err as Error);
        }
    }

    _flush(callback: (error: Error | null) => unknown): void {
        try {
            const remainingText = this.decoder.end();
            this.parser.push(remainingText);
            callback(null);
        } catch (err) {
            callback(err as Error);
        }
    }
}

export default EventSourceStream;
