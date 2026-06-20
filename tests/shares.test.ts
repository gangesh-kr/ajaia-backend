import request from 'supertest';
import { createApp } from '../src/app';
import { supabase } from '../src/lib/supabase';

const app = createApp();

describe('Sharing Integration Tests', () => {
  let aliceId: string;
  let bobId: string;
  let documentId: string;

  beforeAll(async () => {
    // Retrieve UUIDs for Alice and Bob from the database
    const { data: alice } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'alice@example.com')
      .single();

    const { data: bob } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'bob@example.com')
      .single();

    if (!alice || !bob) {
      throw new Error('Seed users not found in the database. Ensure seed script has run.');
    }

    aliceId = alice.id;
    bobId = bob.id;
  });

  afterAll(async () => {
    // Cleanup created document and shares (cascading deletes will handle shares)
    if (documentId) {
      await supabase.from('documents').delete().eq('id', documentId);
    }
  });

  it('Test 1: Successful document sharing and retrieval', async () => {
    // 1. Create document as Alice
    const createRes = await request(app)
      .post('/api/v1/documents')
      .set('X-User-Email', 'alice@example.com')
      .send();

    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id');
    documentId = createRes.body.id;

    // 2. Share with Bob
    const shareRes = await request(app)
      .post('/api/v1/shares')
      .set('X-User-Email', 'alice@example.com')
      .send({
        document_id: documentId,
        user_id: bobId
      });

    expect(shareRes.status).toBe(201);
    expect(shareRes.body).toHaveProperty('id');

    // 3. Fetch shared documents as Bob
    const sharedDocsRes = await request(app)
      .get('/api/v1/documents/shared')
      .set('X-User-Email', 'bob@example.com')
      .send();

    expect(sharedDocsRes.status).toBe(200);
    // Find our specific shared document
    const foundDoc = sharedDocsRes.body.find((doc: any) => doc.id === documentId);
    expect(foundDoc).toBeDefined();
    expect(foundDoc.title).toBe('Untitled Document');
    expect(foundDoc.owner_name).toBe('Alice');
  });

  it('Test 2: Duplicate share is rejected with 409', async () => {
    const res = await request(app)
      .post('/api/v1/shares')
      .set('X-User-Email', 'alice@example.com')
      .send({
        document_id: documentId,
        user_id: bobId
      });

    expect(res.status).toBe(409);
    expect(res.body.error.message.toLowerCase()).toContain('already');
  });

  it('Test 3: Self-share is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/v1/shares')
      .set('X-User-Email', 'alice@example.com')
      .send({
        document_id: documentId,
        user_id: aliceId
      });

    expect(res.status).toBe(400);
  });

  it('Test 4: Export to markdown - owner vs non-owner', async () => {
    // 1. Owner (Alice) should be able to export
    const exportResAlice = await request(app)
      .get(`/api/v1/documents/${documentId}/export`)
      .set('X-User-Email', 'alice@example.com')
      .send();

    expect(exportResAlice.status).toBe(200);
    expect(exportResAlice.headers['content-type']).toContain('text/markdown');
    expect(exportResAlice.headers['content-disposition']).toContain('attachment');

    // 2. Non-owner (Bob) should be forbidden
    const exportResBob = await request(app)
      .get(`/api/v1/documents/${documentId}/export`)
      .set('X-User-Email', 'bob@example.com')
      .send();

    expect(exportResBob.status).toBe(403);
  });

  it('Test 5: Viewer cannot PATCH document (expect 403)', async () => {
    const res = await request(app)
      .patch(`/api/v1/documents/${documentId}`)
      .set('X-User-Email', 'bob@example.com')
      .send({
        title: 'Bob attempted update'
      });

    expect(res.status).toBe(403);
  });

  it('Test 6: Unauthorized user cannot GET document (expect 403)', async () => {
    const res = await request(app)
      .get(`/api/v1/documents/${documentId}`)
      .set('X-User-Email', 'charlie@example.com')
      .send();

    expect(res.status).toBe(403);
  });

  it('Test 7: Upload rejects unsupported file type (expect 400)', async () => {
    const res = await request(app)
      .post('/api/v1/upload')
      .set('X-User-Email', 'alice@example.com')
      .attach('file', Buffer.from('<html></html>'), 'test.html');

    expect(res.status).toBe(400);
  });

  it('Test 8: Upload rejects files over 2MB (expect 400)', async () => {
    // 2.1 MB buffer
    const largeBuffer = Buffer.alloc(2.1 * 1024 * 1024);
    const res = await request(app)
      .post('/api/v1/upload')
      .set('X-User-Email', 'alice@example.com')
      .attach('file', largeBuffer, 'large.txt');

    expect(res.status).toBe(400);
  });

  it('Test 9: Markdown parser produces correct TipTap nodes', async () => {
    const mdContent = '# Title\n- item';
    const res = await request(app)
      .post('/api/v1/upload')
      .set('X-User-Email', 'alice@example.com')
      .attach('file', Buffer.from(mdContent), 'import.md');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('content_json');
    
    const parsed = JSON.parse(res.body.content_json);
    expect(parsed.type).toBe('doc');
    expect(parsed.content[0].type).toBe('heading');
    expect(parsed.content[0].attrs.level).toBe(1);
    expect(parsed.content[0].content[0].text).toBe('Title');
    
    expect(parsed.content[1].type).toBe('bulletList');
    expect(parsed.content[1].content[0].type).toBe('listItem');
    expect(parsed.content[1].content[0].content[0].content[0].text).toBe('item');
    
    // Cleanup imported doc
    if (res.body.id) {
      await supabase.from('documents').delete().eq('id', res.body.id);
    }
  });

  it('Test 10: Delete document - owner vs non-owner', async () => {
    // 1. Non-owner (Bob) should be forbidden from deleting
    const deleteResBob = await request(app)
      .delete(`/api/v1/documents/${documentId}`)
      .set('X-User-Email', 'bob@example.com')
      .send();

    expect(deleteResBob.status).toBe(403);

    // 2. Owner (Alice) should succeed in deleting
    const deleteResAlice = await request(app)
      .delete(`/api/v1/documents/${documentId}`)
      .set('X-User-Email', 'alice@example.com')
      .send();

    expect(deleteResAlice.status).toBe(204);

    // 3. Document should be missing now
    const getDocRes = await request(app)
      .get(`/api/v1/documents/${documentId}`)
      .set('X-User-Email', 'alice@example.com')
      .send();

    expect(getDocRes.status).toBe(404);
  });
});
