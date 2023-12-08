# @server-sent-stream/parser

This is the underlying parsing machinery for [@server-sent-stream/web](https://www.npmjs.com/package/@server-sent-stream/web) and [@server-sent-stream/node](https://www.npmjs.com/package/@server-sent-stream/node). It operates on text data (bring your own decoder), and works in both Node and the browser.

## Usage

- Class: `EventStreamParser`
  - This is the parser itself. You provide it with chunks of text, and it'll call your provided callback every event that it parses.

  - Constructor `(onEvent: (data: string, eventType: string, lastEventId: string) => void)`
    - Create a new parser, specifying the callback that'll be called for every event. The arguments passed in are the event data, the event type (`'message'` if the incoming event doesn't specify), and the last seen event ID.
  - `push(chunk: string)`
    - Push a chunk of data to the parser. This may cause the `onEvent` callback to be called, possibly multiple times.
  - `end()`
    - Indicate that the stream has ended and no more data will be sent. This may also cause `onEvent` to be called, possibly multiple times. You should always call this once the data source ends, in order to properly flush the last event out if one exists.

## Warning

Nothing in the event stream specification says anything about how the chunks will be split up! While the parser handles *textual* chunks being split at arbitrary points, they must still be valid Unicode. It's entirely possible that a chunk may be split within a multi-byte Unicode code point, and it's your responsibility to handle that properly.

For instance, the following code is very commonly used to parse event streams, and is subtly broken:

```js
// Fetch some URL that returns an event stream
const response = await fetch('https://example.com/events', {body: '...'});

// Read from the response
const reader = response.body.getReader();

while (true) {
    // `value` is a Uint8Array containing some portion of the response body.
    const {done, value} = await reader.read();
    if (done) break;

    // This code is BROKEN! If the chunk starts or ends in the middle of a
    // multi-byte Unicode character, that character will not be decoded, and
    // will be replaced by U+FFFF REPLACEMENT CHARACTER(s) (�).
    const textChunk = new TextDecoder().decode(value);
}
```

You need to use a decoding method that buffers partial Unicode data, like the `TextDecoderStream` API:
```js
// Fetch some URL that returns an event stream
const response = await fetch('https://example.com/events', {body: '...'});

// The TextDecoderStream has an internal buffer. If a chunk of bytes ends in the
// middle of a multi-byte character, it will buffer it until the rest of the
// character arrives in the next chunk.
const decoder = new TextDecoderStream();
response.body.pipeThrough(decoder);

// Read from the response
const reader = response.body.getReader();

while (true) {
    // `value` is a string, guaranteed to be comprised of complete code points.
    const {done, value} = await reader.read();
    if (done) break;

    // We can now do whatever we want with `value`, e.g. parse it...
}
```
