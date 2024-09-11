import t from 'tap';
import {Readable} from 'node:stream';

import testParsing from '../../../fixtures/parsing.js';
import testStream from '../../../fixtures/stream.js';

import EventSourceStream from '../src/index.js';

const makeTestStream = (chunks: Uint8Array[]) => {
    let i = 0;
    return new Readable({
        read() {
            if (i >= chunks.length) {
                this.push(null);
                return;
            }
            this.push(chunks[i]);
            i++;
        }
    });
};

const readTestStream = (stream: Readable) => {
    const values: MessageEvent[] = [];

    return new Promise((resolve, reject) => {
        stream.on('data', chunk => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            values.push(chunk as MessageEvent<any>);
        });
        stream.once('end', () => resolve(values));
        stream.once('error', reject);
    });
};

const testEndToEnd = (chunks: Uint8Array[]) => {
    const testStream = makeTestStream(chunks);
    const sseStream = new EventSourceStream();
    testStream.pipe(sseStream);
    return readTestStream(sseStream);
};

void t.test('EventSourceStream', t => {
    testParsing(t, chunks =>
        testEndToEnd(chunks.map(chunk => new TextEncoder().encode(chunk)))
    );

    testStream(t, testEndToEnd);

    t.end();
});
