'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const Exporter_1 = require('./src/extension/utils/Exporter');
const CodeGenerator_1 = require('./src/extension/utils/CodeGenerator');
const Importer_1 = require('./src/extension/utils/Importer');
const assert = require('assert');
// Mock Request
const mockRequest = {
    id: '1',
    name: 'Test Request',
    method: 'POST',
    url: 'https://api.example.com/data',
    type: 'request',
    headers: [
        { id: 'h1', key: 'Content-Type', value: 'application/json', isEnabled: true },
        { id: 'h2', key: 'Authorization', value: 'Bearer token', isEnabled: true }
    ],
    queryParams: [{ id: 'q1', key: 'page', value: '1', isEnabled: true }],
    body: {
        type: 'raw',
        raw: '{"foo":"bar"}'
    }
};
const mockCollection = {
    id: 'col1',
    name: 'Test Collection',
    type: 'folder',
    children: [mockRequest]
};
async function testExporter() {
    console.log('Testing Exporter...');
    try {
        const yamlOutput = Exporter_1.Exporter.exportToSwagger(mockCollection);
        console.log('Exporter Output (First 100 chars):', yamlOutput.substring(0, 100));
        assert.ok(yamlOutput.includes('openapi: 3.0.0'), 'Should contain openapi version');
        assert.ok(yamlOutput.includes('/data:'), 'Should contain path');
        assert.ok(yamlOutput.includes('post:'), 'Should contain method');
        console.log('Exporter Test Passed');
    } catch (e) {
        console.error('Exporter Test Failed:', e);
    }
}
async function testCodeGenerator() {
    console.log('Testing CodeGenerator...');
    try {
        const curl = CodeGenerator_1.CodeGenerator.generate(mockRequest, 'curl');
        console.log('Generated cURL:', curl);
        assert.ok(curl.includes('curl -X POST'), 'Should be POST');
        assert.ok(curl.includes('https://api.example.com/data'), 'Should have URL');
        assert.ok(curl.includes("-H 'Content-Type: application/json'"), 'Should have Content-Type');
        const js = CodeGenerator_1.CodeGenerator.generate(mockRequest, 'javascript');
        console.log('Generated JS (First 50 chars):', js.substring(0, 50));
        assert.ok(js.includes('fetch('), 'Should use fetch');
        console.log('CodeGenerator Test Passed');
    } catch (e) {
        console.error('CodeGenerator Test Failed:', e);
    }
}
async function testImporter() {
    console.log('Testing Importer (Swagger YAML)...');
    const yamlContent = `
openapi: 3.0.0
info:
  title: Sample API
  version: 0.1.9
paths:
  /users:
    get:
      summary: Returns a list of users.
      responses:
        '200':
          description: A JSON array of user names
`;
    try {
        const items = Importer_1.Importer.parse(yamlContent);
        console.log('Imported Items:', JSON.stringify(items, null, 2));
        assert.strictEqual(items.length, 1, 'Should have 1 item');
        assert.strictEqual(items[0].url, '/users', 'URL should match');
        assert.strictEqual(items[0].method, 'GET', 'Method should match');
        console.log('Importer Test Passed');
    } catch (e) {
        console.error('Importer Test Failed:', e);
    }
}
async function run() {
    await testExporter();
    await testCodeGenerator();
    await testImporter();
}
run();
//# sourceMappingURL=verify_features.js.map
