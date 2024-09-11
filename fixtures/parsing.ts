import type {Test} from 'tap';

const testAllLineEndings = <T>(t: Test, inputText: string, processText: (input: string[]) => Promise<T>) => {
    const crText = inputText.replaceAll('\n', '\r').split('|');
    const lfText = inputText.split('|');
    const crlfText = inputText.replaceAll('\n', '\r\n').split('|');
    void t.test('cr', async t => {
        const result = await processText(crText);
        t.matchSnapshot(result);
        t.end();
    });

    void t.test('lf', async t => {
        const result = await processText(lfText);
        t.matchSnapshot(result);
        t.end();
    });

    void t.test('crlf', async t => {
        const result = await processText(crlfText);
        t.matchSnapshot(result);
        t.end();
    });

    void t.test('all line endings equal', async t => {
        const lfResult = await processText(crText);
        const crResult = await processText(lfText);
        const crlfResult = await processText(crlfText);
        t.match(lfResult, crResult);
        t.match(lfResult, crlfResult);
        t.match(crResult, crlfResult);
        t.end();
    });
};

const testParser = <T>(t: Test, processText: (input: string[]) => Promise<T>) => {
    void t.test('basic', t => {
        testAllLineEndings(t, 'data: abc\ndata: def\n\ndata:foo\n\n', processText);
        t.end();
    });

    void t.test('chunked', t => {
        testAllLineEndings(t, 'data: abc\ndata: def|\n\ndata:foo\n\n', processText);
        t.end();
    });

    void t.test('very chunked', t => {
        testAllLineEndings(t, 'da|ta:| ab|c\ndata: |def|\n|\n|data:foo\n\n', processText);
        t.end();
    });

    void t.test('chunk split at crlf', async t => {
        const result = await processText('data: abc\r|\ndata: def\r\n\r|\ndata:foo\r\n\r\n'.split('|'));
        t.matchSnapshot(result);
        t.end();
    });

    void t.test('cr followed by crlf', async t => {
        const result = await processText('data: abc\r\r\ndata: def\r\r'.split('|'));
        t.matchSnapshot(result);
        t.end();
    });

    void t.test('chunk split at cr followed by crlf 1', async t => {
        const result = await processText('data: abc\r\r|\ndata: def\r\r'.split('|'));
        t.matchSnapshot(result);
        t.end();
    });

    void t.test('chunk split at cr followed by crlf 2', async t => {
        const result = await processText('data: abc\r|\r\ndata: def\r\r'.split('|'));
        t.matchSnapshot(result);
        t.end();
    });

    void t.test('triple newline', t => {
        testAllLineEndings(t, 'data: abc\n\n\ndata: def\n\n', processText);
        t.end();
    });

    void t.test('chunk split at end', t => {
        testAllLineEndings(t, 'data: abc\ndata: def|\n\ndata:foo\n|\n|', processText);
        t.end();
    });

    void t.test('chunk split at space', t => {
        testAllLineEndings(t, 'data: |abc\ndata:| def|\n\ndata:|foo\n\n', processText);
        t.end();
    });

    void t.test('only one leading space stripped', t => {
        testAllLineEndings(t, 'data:  abc\n\n', processText);
        t.end();
    });

    void t.test('invalid stream', t => {
        testAllLineEndings(t, 'this will never match', processText);
        t.end();
    });

    void t.test('only one trailing newline stripped', t => {
        testAllLineEndings(t, 'data:  abc\ndata:\ndata:\n\n', processText);
        t.end();
    });

    void t.test('field with no colon', t => {
        testAllLineEndings(t, 'data: abc\ndata\ndata\ndata:foo\ndata\n\n', processText);
        t.end();
    });

    void t.test('event types', t => {
        testAllLineEndings(t, 'data: foo\nevent: bar\nevent: baz\ndata: quux\n\ndata: noeventtype\n\n', processText);
        t.end();
    });

    void t.test('event IDs', t => {
        // eslint-disable-next-line @stylistic/max-len
        testAllLineEndings(t, 'data: foo\nid: bar\nid: baz\ndata: quux\n\ndata: sameid\n\nid: newid\n\ndata: replacedid\n\n', processText);
        t.end();
    });

    void t.test('event ID with null byte', t => {
        // eslint-disable-next-line @stylistic/max-len
        testAllLineEndings(t, 'data: foo\nid: bar\nid: inval\0id\n\ndata:again\n\nid: baz\ndata: quux\n\n', processText);
        t.end();
    });

    void t.test('comment', t => {
        testAllLineEndings(t, 'data: abc\ndata: def\n:this is a comment!\n\ndata:foo\n\n', processText);
        t.end();
    });

    void t.test('empty event type is treated as \'message\'', t => {
        testAllLineEndings(t, 'data: foo\nevent: some_custom_event\nevent:\n\n', processText);
        t.end();
    });
};

export default testParser;
