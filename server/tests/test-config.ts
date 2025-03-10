import chai from 'chai';
import sinonChai from 'sinon-chai';

// Configure chai to use sinon-chai for assertions on spies/stubs
chai.use(sinonChai);

export const expect = chai.expect;