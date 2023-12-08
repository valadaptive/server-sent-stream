/**
 * A parser for the server-sent events stream format.
 *
 * Note that this parser does not handle text decoding! To do it correctly, use a streaming text decoder, since the
 * stream could be split up mid-Unicode character, and decoding each chunk at once could lead to incorrect results.
 *
 * This parser is used by streaming chunks in using the {@link push} method, and then calling the {@link end} method
 * when the stream has ended.
 */
class EventStreamParser {
    /** The part of the stream not yet processed because we're waiting for more data to come in. */
    private streamBuffer;

    /** The current data event's contents so far. */
    private dataBuffer;

    /** The current event type; 'message' by default. */
    private eventType;

    /** The last seen event ID. */
    private lastEventId;

    /** Sticky-mode regex which parses the stream. */
    private parserRegex;

    /**
     * A callback which will be called for each new event parsed.
     */
    public onEvent;

    /**
     * Construct a new parser for a single stream.
     * @param onEvent A callback which will be called for each new event parsed. The parameters in order are the
     * event data, the event type, and the last seen event ID. This may be called none, once, or many times per push()
     * call, and may be called from the end() call.
     */
    constructor(onEvent: (data: string, eventType: string, lastEventId: string) => unknown) {
        this.streamBuffer = '';
        this.dataBuffer = '';
        this.eventType = 'message';
        this.lastEventId = '';

        // https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream Parses a line from the
        // event stream. This is hard to read, so here's how it works: The first group matches either a field (field
        // name, optional (colon, value)) or a comment (colon, text). That group is optional, and is followed by a group
        // which matches a newline. This means that: The only *capturing* groups are the field, field value, comment,
        // and newline. This lets us determine what the line is by which capture groups are filled in. The field and
        // value groups being present means it's a field, the comment group being present means it's a comment, and
        // neither means it's a blank line. This is best viewed in RegExr if you value your sanity.
        this.parserRegex = /(?:(?:([^\r\n:]+)(?:: ?([^\r\n]*)?)?)|(:[^\r\n]*))?(\r\n|\r|\n)/y;

        this.onEvent = onEvent;
    }

    /**
     * Process a single incoming chunk of the event stream.
     * @param isLastChunk Whether this is known to be the last chunk in the stream, and no more will follow.
     */
    private _processChunk(isLastChunk: boolean) {
        while (this.parserRegex.lastIndex < this.streamBuffer.length) {
            const lastLastIndex = this.parserRegex.lastIndex;
            const matchResult = this.parserRegex.exec(this.streamBuffer);
            // We need to wait for more data to come in
            if (!matchResult) {
                if (lastLastIndex !== 0) {
                    // Slice off what we've successfully parsed so far. lastIndex is set to 0 if there's no match,
                    // so it'll be set to start off here.
                    this.streamBuffer = this.streamBuffer.slice(lastLastIndex);
                }
                return;
            }

            const field = matchResult[1];
            const value = matchResult[2];
            const comment = matchResult[3];
            const newline = matchResult[4];
            // Corner case: if the last character in the buffer is '\r', we need to wait for more data. These chunks
            // could be split up any which way, and it's entirely possible that the next chunk we receive will start
            // with '\n', and this trailing '\r' is actually part of a '\r\n' sequence.
            if (newline === '\r' && this.parserRegex.lastIndex === this.streamBuffer.length && !isLastChunk) {
                // Trim off what we've parsed so far, and wait for more data
                this.streamBuffer = this.streamBuffer.slice(lastLastIndex);
                this.parserRegex.lastIndex = 0;
                return;
            }

            // https://html.spec.whatwg.org/multipage/server-sent-events.html#processField
            if (typeof field === 'string') {
                switch (field) {
                    case 'event':
                        this.eventType = value;
                        break;
                    case 'data':
                        // If the data field is empty, there won't be a match for the value. Just add a newline.
                        if (typeof value === 'string') this.dataBuffer += value;
                        this.dataBuffer += '\n';
                        break;
                    case 'id':
                        if (!value.includes('\0')) this.lastEventId = value;
                        break;
                    // We do nothing for the `delay` type, and other types are explicitly ignored
                }
            } else if (typeof comment === 'string') {
                continue;
            } else {
                // https://html.spec.whatwg.org/multipage/server-sent-events.html#dispatchMessage
                // Must be a newline. Dispatch the event.
                // Skip the event if the data buffer is the empty string.
                if (this.dataBuffer === '') continue;
                // Trim the *last* trailing newline
                if (this.dataBuffer[this.dataBuffer.length - 1] === '\n') {
                    this.dataBuffer = this.dataBuffer.slice(0, -1);
                }
                this.onEvent(this.dataBuffer, this.eventType, this.lastEventId);
                this.dataBuffer = '';
                this.eventType = 'message';
            }
        }
    }

    /**
     * Push a new chunk of data to the parser. This may cause the {@link onEvent} callback to be called, possibly
     * multiple times depending on the number of events contained within the chunk.
     * @param chunk The incoming chunk of data.
     */
    public push(chunk: string) {
        this.streamBuffer += chunk;
        this._processChunk(false);
    }

    /**
     * Indicate that the stream has ended. This may cause additional events to be produced, causing the {@link onEvent}
     * callback to be called, possibly multiple times.
     */
    public end() {
        this._processChunk(true);
    }
}

export default EventStreamParser;
