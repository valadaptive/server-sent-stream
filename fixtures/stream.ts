import type {Test} from 'tap';

const testStream = <T>(t: Test, processText: (input: Uint8Array[]) => Promise<T>) => {
    void t.test('chunk split mid-code point', async t => {
        const textData = new TextEncoder().encode('data: 𐍈\n\n');
        t.equal(textData.indexOf(0xF0), 6);

        for (let slicePosition = textData.indexOf(0xF0); slicePosition < textData.indexOf(0xF0) + 5; slicePosition++) {
            const chunks = [
                textData.slice(0, slicePosition),
                textData.slice(slicePosition)
            ];
            const result = await processText(chunks);
            t.matchSnapshot(result);
        }
        t.end();
    });

    void t.test('utf-8 BOM is ignored', async t => {
        const textData = new TextEncoder().encode('data: foo\ndata: bar\n\n');
        const dataWithBOM = new Uint8Array(textData.length + 3);
        dataWithBOM.set([0xEF, 0xBB, 0xBF]);
        dataWithBOM.set(textData, 3);
        const result = await processText([dataWithBOM]);
        t.matchSnapshot(result);
        t.end();
    });
};

export default testStream;
