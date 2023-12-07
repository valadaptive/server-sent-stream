# Server-Sent Streams

This package allows you to consume [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) through the Web Streams API. This lets you use them through e.g. the fetch API.

## Usage

This package can be used as an ESM or CommonJS module:
```js
import EventSourceStream from 'server-sent-stream';
```

```js
const EventSourceStream = require('server-sent-stream');
```

The `EventSourceStream` implements the [`TransformStream` interface](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream). It consumes a stream of `Uint8Array`s (like the kind that the fetch API returns), and produces a stream of `MessageEvent`s.

Here's an example of how it can be used with the fetch API:
```js
// Fetch some URL that returns an event stream
const response = await fetch('https://example.com/events', {body: '...'});

// Pipe the response body into an EventSourceStream
const decoder = new EventSourceStream();
response.body.pipeThrough(decoder);

// Read from the EventSourceStream
const reader = decoder.readable.getReader();

while (true) {
    const {done, value} = await reader.read();
    if (done) break;

    // The value will be a `MessageEvent`.
    console.log(value);
    // MessageEvent {data: 'message data', lastEventId: '', …}
}
```

## Limitations

There are a couple things that the `EventSource` API does and this doesn't:
- Reconnection does not occur, and `retry` events are ignored.
- The `origin` attribute of the emitted `MessageEvent`s is not set.
