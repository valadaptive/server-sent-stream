import EventStreamParser from '@server-sent-stream/parser';

/**
 * A Web stream which handles Server-Sent Events from a binary ReadableStream like you get from the fetch API.
 * Implements the TransformStream interface, and can be used with the Streams API as such.
 */
class EventSourceStream implements TransformStream<Uint8Array, MessageEvent<string>> {
    /** Stream of MessageEvents to consume. */
    readable: ReadableStream<MessageEvent<string>>;
    /** Stream from the input buffer. */
    writable: WritableStream<Uint8Array>;

    constructor() {
        // Two important things to note here:
        // 1. The SSE spec allows for an optional UTF-8 BOM.
        // 2. We have to use a *streaming* decoder, in case two adjacent data chunks are split up in the middle of a
        // multibyte Unicode character. Trying to parse the two separately would result in data corruption.
        const decoder = new TextDecoderStream('utf-8');

        let parser: EventStreamParser;
        const sseStream = new TransformStream<string, MessageEvent<string>>({
            start(controller) {
                parser = new EventStreamParser((data, eventType, lastEventId) => {
                    controller.enqueue(new MessageEvent(eventType, {data, lastEventId}));
                });
            },

            transform(chunk) {
                parser.push(chunk);
            },

            flush() {
                parser.end();
            }
        });

        decoder.readable.pipeThrough(sseStream);

        this.readable = sseStream.readable;
        this.writable = decoder.writable;
    }
}

export default EventSourceStream;
