const xssSanitize = require('../middleware/sanitize');

const mockReq = (body = {}, query = {}, params = {}) => ({
  body,
  query,
  params,
});

const mockNext = () => jest.fn();

describe('XSS Sanitize Middleware', () => {
  // ===== Body sanitization =====
  test('sanitizes script tags in body strings', () => {
    const req = mockReq({ name: '<script>alert("xss")</script>' });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.body.name).not.toContain('<script>');
    expect(next).toHaveBeenCalled();
  });

  test('sanitizes img onerror attack in body', () => {
    const req = mockReq({ name: '<img src=x onerror=alert(1)>' });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.body.name).not.toContain('onerror');
    expect(next).toHaveBeenCalled();
  });

  test('sanitizes nested objects in body', () => {
    const req = mockReq({
      address: {
        city: '<script>steal()</script>Mumbai',
      },
    });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.body.address.city).not.toContain('<script>');
    expect(next).toHaveBeenCalled();
  });

  test('sanitizes arrays in body', () => {
    const req = mockReq({
      tags: ['<b>safe</b>', '<script>bad</script>'],
    });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.body.tags[1]).not.toContain('<script>');
    expect(next).toHaveBeenCalled();
  });

  test('leaves clean strings unchanged', () => {
    const req = mockReq({ name: 'John Doe', email: 'john@example.com' });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.body.name).toBe('John Doe');
    expect(req.body.email).toBe('john@example.com');
    expect(next).toHaveBeenCalled();
  });

  test('preserves numbers and booleans', () => {
    const req = mockReq({ price: 499, inStock: true, discount: null });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.body.price).toBe(499);
    expect(req.body.inStock).toBe(true);
    expect(req.body.discount).toBe(null);
    expect(next).toHaveBeenCalled();
  });

  // ===== Query sanitization =====
  test('sanitizes query params', () => {
    const req = mockReq({}, { q: '<script>alert(1)</script>shoes' });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.query.q).not.toContain('<script>');
    expect(req.query.q).toContain('shoes');
    expect(next).toHaveBeenCalled();
  });

  // ===== Params sanitization =====
  test('sanitizes route params', () => {
    const req = mockReq({}, {}, { id: '<script>x</script>' });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.params.id).not.toContain('<script>');
    expect(next).toHaveBeenCalled();
  });

  // ===== Edge cases =====
  test('handles empty body', () => {
    const req = mockReq();
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  test('handles deeply nested objects', () => {
    const req = mockReq({
      level1: {
        level2: {
          level3: '<script>deep()</script>value',
        },
      },
    });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.body.level1.level2.level3).not.toContain('<script>');
    expect(next).toHaveBeenCalled();
  });

  test('sanitizes event handler attributes', () => {
    const req = mockReq({
      bio: '<div onmouseover="steal()">hover me</div>',
    });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.body.bio).not.toContain('onmouseover');
    expect(next).toHaveBeenCalled();
  });

  test('sanitizes iframe injection', () => {
    const req = mockReq({
      description: '<iframe src="https://evil.com"></iframe>',
    });
    const next = mockNext();

    xssSanitize(req, {}, next);
    expect(req.body.description).not.toContain('<iframe');
    expect(next).toHaveBeenCalled();
  });
});
