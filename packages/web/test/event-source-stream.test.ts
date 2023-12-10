import {describe} from '@jest/globals';

import testParsing from '../../../fixtures/parsing';
import testStream from '../../../fixtures/stream';

import EventSourceStream from '../src/index';

const makeTestStream = (chunks: Uint8Array[]) => {
    let i = 0;
    return new ReadableStream<Uint8Array>({
        pull(controller) {
            if (i >= chunks.length) {
                controller.close();
                return;
            }
            controller.enqueue(chunks[i]);
            i++;
        }
    });
};

const readTestStream = <T>(stream: ReadableStream<T>) => {
    const reader = stream.getReader();

    const values: T[] = [];

    return new Promise<T[]>(resolve => {
        const push = () => {
            void reader.read().then(({done, value}) => {
                if (done) {
                    resolve(values);
                } else {
                    values.push(value);
                    push();
                }
            });
        };

        push();
    });
};

const testEndToEnd = (chunks: Uint8Array[]) => {
    const testStream = makeTestStream(chunks);
    const sseStream = new EventSourceStream();
    testStream.pipeThrough(sseStream);
    return readTestStream(sseStream.readable);
};

describe('EventSourceStream', () => {
    testParsing(chunks =>
        testEndToEnd(chunks.map(chunk => new TextEncoder().encode(chunk)))
    );

    testStream(testEndToEnd);
});
