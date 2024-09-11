# @server-sent-stream/node

This package allows you to consume [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) through Node's [stream API](https://nodejs.org/api/stream.html).

## Usage

This package can be used as an ESM or CommonJS module:
```js
import EventSourceStream from '@server-sent-stream/node';
```

```js
const EventSourceStream = require('@server-sent-stream/node').default;
```

The `EventSourceStream` is a Node [stream.Transform](https://nodejs.org/api/stream.html#class-streamtransform). It consumes a stream of binary data (e.g. `Buffer`s or `Uint8Array`s), and produces a stream of `MessageEvent`s.

You can use it with any Node `Readable` stream, like the kind returned by node-fetch:
```js
// Fetch some URL that returns an event stream
const response = await fetch('https://example.com/events', {body: '...'});

// Pipe the response body into an EventSourceStream
const decoder = new EventSourceStream();

decoder.on('data', message => {
    // The value will be a `MessageEvent`.
    console.log(message);
    // MessageEvent {data: 'message data', lastEventId: '', …}
})

response.body.pipe(decoder);
```

## Related packages
If you want a streaming interface for the Web Streams API, so you can use this in the browser, see [@server-sent-stream/web](https://www.npmjs.com/package/@server-sent-stream/web).
For just the event stream parser, see [@server-sent-stream/parser](https://www.npmjs.com/package/@server-sent-stream/parser).
