import {describe, expect, test} from '@jest/globals';

const testAllLineEndings = <T>(inputText: string, processText: (input: string[]) => Promise<T>) => {
    const crText = inputText.replaceAll('\n', '\r').split('|');
    const lfText = inputText.split('|');
    const crlfText = inputText.replaceAll('\n', '\r\n').split('|');
    test('cr', async() => {
        const result = await processText(crText);
        expect(result).toMatchSnapshot();
    });

    test('lf', async() => {
        const result = await processText(lfText);
        expect(result).toMatchSnapshot();
    });

    test('crlf', async() => {
        const result = await processText(crlfText);
        expect(result).toMatchSnapshot();
    });

    test('all line endings equal', async() => {
        const lfResult = await processText(crText);
        const crResult = await processText(lfText);
        const crlfResult = await processText(crlfText);
        expect(lfResult).toEqual(crResult);
        expect(lfResult).toEqual(crlfResult);
        expect(crResult).toEqual(crlfResult);
    });
};

const testParser = <T>(processText: (input: string[]) => Promise<T>) => {
    describe('basic', () => {
        testAllLineEndings('data: abc\ndata: def\n\ndata:foo\n\n', processText);
    });

    describe('chunked', () => {
        testAllLineEndings('data: abc\ndata: def|\n\ndata:foo\n\n', processText);
    });

    describe('very chunked', () => {
        testAllLineEndings('da|ta:| ab|c\ndata: |def|\n|\n|data:foo\n\n', processText);
    });

    test('chunk split at crlf', async() => {
        const result = await processText('data: abc\r|\ndata: def\r\n\r|\ndata:foo\r\n\r\n'.split('|'));
        expect(result).toMatchSnapshot();
    });

    test('cr followed by crlf', async() => {
        const result = await processText('data: abc\r\r\ndata: def\r\r'.split('|'));
        expect(result).toMatchSnapshot();
    });

    test('chunk split at cr followed by crlf 1', async() => {
        const result = await processText('data: abc\r\r|\ndata: def\r\r'.split('|'));
        expect(result).toMatchSnapshot();
    });

    test('chunk split at cr followed by crlf 2', async() => {
        const result = await processText('data: abc\r|\r\ndata: def\r\r'.split('|'));
        expect(result).toMatchSnapshot();
    });

    describe('triple newline', () => {
        testAllLineEndings('data: abc\n\n\ndata: def\n\n', processText);
    });

    describe('chunk split at end', () => {
        testAllLineEndings('data: abc\ndata: def|\n\ndata:foo\n|\n|', processText);
    });

    describe('chunk split at space', () => {
        testAllLineEndings('data: |abc\ndata:| def|\n\ndata:|foo\n\n', processText);
    });

    describe('only one leading space stripped', () => {
        testAllLineEndings('data:  abc\n\n', processText);
    });

    describe('invalid stream', () => {
        testAllLineEndings('this will never match', processText);
    });

    describe('only one trailing newline stripped', () => {
        testAllLineEndings('data:  abc\ndata:\ndata:\n\n', processText);
    });

    describe('field with no colon', () => {
        testAllLineEndings('data: abc\ndata\ndata\ndata:foo\ndata\n\n', processText);
    });

    describe('event types', () => {
        testAllLineEndings('data: foo\nevent: bar\nevent: baz\ndata: quux\n\ndata: noeventtype\n\n', processText);
    });

    describe('event IDs', () => {
        // eslint-disable-next-line @stylistic/max-len
        testAllLineEndings('data: foo\nid: bar\nid: baz\ndata: quux\n\ndata: sameid\n\nid: newid\n\ndata: replacedid\n\n', processText);
    });

    describe('event ID with null byte', () => {
        testAllLineEndings('data: foo\nid: bar\nid: inval\0id\n\ndata:again\n\nid: baz\ndata: quux\n\n', processText);
    });

    describe('comment', () => {
        testAllLineEndings('data: abc\ndata: def\n:this is a comment!\n\ndata:foo\n\n', processText);
    });

    describe('empty event type is treated as \'message\'', () => {
        testAllLineEndings('data: foo\nevent: some_custom_event\nevent:\n\n', processText);
    });
};

export default testParser;
