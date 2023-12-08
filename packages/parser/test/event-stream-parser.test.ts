import {describe} from '@jest/globals';

import EventStreamParser from '../src/index';
import testParser from '../../../fixtures/parsing';

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

describe('EventStreamParser', () => {
    testParser(testEndToEnd);
});
