import {describe, expect, test} from '@jest/globals';

import EventSourceStream from '../src/index';

const makeTestStream = (inputText: string) => {
    const chunks = inputText.split('|');
    let i = 0;
    return new ReadableStream<Uint8Array>({
        pull(controller) {
            if (i >= chunks.length) {
                controller.close();
                return;
            }
            controller.enqueue(new TextEncoder().encode(chunks[i]));
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

const testEndToEnd = (inputText: string) => {
    const testStream = makeTestStream(inputText);
    const sseStream = new EventSourceStream();
    testStream.pipeThrough(sseStream);
    return readTestStream(sseStream.readable);
};

const testAllLineEndings = (inputText: string) => {
    test('cr', async() => {
        const crText = inputText.replaceAll('\n', '\r');
        const result = await testEndToEnd(crText);
        expect(result).toMatchSnapshot();
    });

    test('lf', async() => {
        const result = await testEndToEnd(inputText);
        expect(result).toMatchSnapshot();
    });

    test('crlf', async() => {
        const crlfText = inputText.replaceAll('\n', '\r\n');
        const result = await testEndToEnd(crlfText);
        expect(result).toMatchSnapshot();
    });
};

describe('makeSSEStream', () => {
    describe('basic', () => {
        testAllLineEndings('data: abc\ndata: def\n\ndata:foo\n\n');
    });

    describe('chunked', () => {
        testAllLineEndings('data: abc\ndata: def|\n\ndata:foo\n\n');
    });

    describe('very chunked', () => {
        testAllLineEndings('da|ta:| ab|c\ndata: |def|\n|\n|data:foo\n\n');
    });

    test('chunk split at crlf', async() => {
        const result = await testEndToEnd('data: abc\r|\ndata: def\r\n\r|\ndata:foo\r\n\r\n');
        expect(result).toMatchSnapshot();
    });

    describe('chunk split at end', () => {
        testAllLineEndings('data: abc\ndata: def|\n\ndata:foo\n|\n|');
    });

    describe('chunk split at space', () => {
        testAllLineEndings('data: |abc\ndata:| def|\n\ndata:|foo\n\n');
    });

    describe('only one leading space stripped', () => {
        testAllLineEndings('data:  abc\n\n');
    });

    describe('invalid stream', () => {
        testAllLineEndings('this will never match');
    });

    describe('only one trailing newline stripped', () => {
        testAllLineEndings('data:  abc\ndata:\ndata:\n\n');
    });

    describe('field with no colon', () => {
        testAllLineEndings('data: abc\ndata\ndata\ndata:foo\ndata\n\n');
    });

    describe('event types', () => {
        testAllLineEndings('data: foo\nevent: bar\nevent: baz\ndata: quux\n\ndata: noeventtype\n\n');
    });

    describe('event IDs', () => {
        // eslint-disable-next-line max-len
        testAllLineEndings('data: foo\nid: bar\nid: baz\ndata: quux\n\ndata: sameid\n\nid: newid\n\ndata: replacedid\n\n');
    });
});
