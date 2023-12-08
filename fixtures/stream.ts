import {expect, test} from '@jest/globals';

const testStream = <T>(processText: (input: Uint8Array[]) => Promise<T>) => {
    test('chunk split mid-code point', async() => {
        const textData = new TextEncoder().encode('data: 𐍈\n\n');
        expect(textData.indexOf(0xF0)).toBe(6);

        for (let slicePosition = textData.indexOf(0xF0); slicePosition < textData.indexOf(0xF0) + 5; slicePosition++) {
            const chunks = [
                textData.slice(0, slicePosition),
                textData.slice(slicePosition)
            ];
            const result = await processText(chunks);
            expect(result).toMatchSnapshot();
        }
    });

    test('utf-8 BOM is ignored', async() => {
        const textData = new TextEncoder().encode('data: foo\ndata: bar\n\n');
        const dataWithBOM = new Uint8Array(textData.length + 3);
        dataWithBOM.set([0xEF, 0xBB, 0xBF]);
        dataWithBOM.set(textData, 3);
        const result = await processText([dataWithBOM]);
        expect(result).toMatchSnapshot();
    });
};

export default testStream;
