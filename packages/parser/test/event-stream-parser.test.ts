import t from 'tap';

import EventStreamParser from '../src/index.js';
import testParser from '../../../fixtures/parsing.js';

const testEndToEnd = (chunks: string[]) => {
    const events: {data: string, eventType: string, lastEventId: string}[] = [];
    const parser = new EventStreamParser((data, eventType, lastEventId) => {
        events.push({data, eventType, lastEventId});
    });
    for (const chunk of chunks) {
        parser.push(chunk);
    }
    parser.end();
    return Promise.resolve(events);
};

void t.test('EventStreamParser', t => {
    testParser(t, testEndToEnd);
    t.end();
});
