import {describe} from '@jest/globals';
import {Readable} from 'node:stream';

import testParsing from '../../../fixtures/parsing';
import testStream from '../../../fixtures/stream';

import EventSourceStream from '../src/index';

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
            values.push(chunk);
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

describe('EventSourceStream', () => {
    testParsing(chunks =>
        testEndToEnd(chunks.map(chunk => new TextEncoder().encode(chunk)))
    );

    testStream(testEndToEnd);
});
