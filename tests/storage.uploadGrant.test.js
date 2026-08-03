/**
 * Storage upload grants are tested against the compiled SDK output.
 * Run `npm run build` before `npm test`.
 */
const { Storage } = require('../lib/resources/storage.cjs');

function makeStorage(post) {
  const storage = Object.create(Storage.prototype);
  storage.post = post;
  storage.patch = jest.fn();
  return storage;
}

describe('Storage upload grants', () => {
  test('creates a one-time grant through the platform endpoint', async () => {
    const grant = {
      id: 'grant-1',
      applicationId: 'app-1',
      purpose: 'ticket-attachments',
      folderPath: 'applications/service-desk/space-1/ticket-attachments',
      fileName: 'screen.png',
      mimeType: 'image/png',
      maxSize: 128,
      expiresAt: '2026-07-29T12:10:00.000Z',
    };
    const post = jest.fn(async () => ({ data: grant }));
    const storage = makeStorage(post);

    await expect(storage.createUploadGrant({
      applicationId: 'app-1',
      permissionCode: 'service-desk.attachment.upload',
      purpose: 'ticket-attachments',
      fileName: 'screen.png',
      mimeType: 'image/png',
      size: 128,
    })).resolves.toEqual(grant);
    expect(post).toHaveBeenCalledWith('/storage/upload-grants', expect.objectContaining({
      permissionCode: 'service-desk.attachment.upload',
      fileName: 'screen.png',
    }));
  });

  test('adds the grant id to browser multipart uploads', async () => {
    const originalDocument = global.document;
    global.document = {};
    try {
      const post = jest.fn(async () => ({ data: { id: 'file-1', name: 'screen.png' } }));
      const storage = makeStorage(post);
      const file = new Blob(['image'], { type: 'image/png' });

      await storage.uploadFile(file, { fileName: 'screen.png', uploadGrantId: 'grant-1' });

      const [, form] = post.mock.calls[0];
      expect(form).toBeInstanceOf(FormData);
      expect(form.get('uploadGrantId')).toBe('grant-1');
      expect(form.get('file')).toBeInstanceOf(Blob);
    } finally {
      if (originalDocument === undefined) delete global.document;
      else global.document = originalDocument;
    }
  });

  test('creates scoped read grants and updates application file bindings', async () => {
    const post = jest.fn(async () => ({
      data: {
        id: 'read-1',
        applicationId: 'app-1',
        fileId: 'file-1',
        url: 'https://files.example/read',
        expiresAt: '2026-07-30T01:00:00.000Z',
        disposition: 'download',
      },
    }));
    const storage = makeStorage(post);
    storage.patch.mockResolvedValue({
      data: {
        fileId: 'file-1',
        applicationId: 'app-1',
        visibility: 'public',
        authorizedUserIds: ['user-1'],
      },
    });

    await expect(storage.createFileAccessGrant({
      applicationId: 'app-1',
      fileId: 'file-1',
      permissionCode: 'service-desk.attachment.read.own',
    })).resolves.toMatchObject({ id: 'read-1', fileId: 'file-1' });
    await expect(storage.bindApplicationFile('file-1', {
      applicationId: 'app-1',
      permissionCode: 'service-desk.attachment.manage',
      visibility: 'public',
      authorizedUserIds: ['user-1'],
    })).resolves.toMatchObject({ visibility: 'public' });

    expect(post).toHaveBeenCalledWith('/storage/access-grants', expect.any(Object));
    expect(storage.patch).toHaveBeenCalledWith(
      '/storage/application-files/file-1/binding',
      expect.objectContaining({ visibility: 'public' })
    );
  });
});
