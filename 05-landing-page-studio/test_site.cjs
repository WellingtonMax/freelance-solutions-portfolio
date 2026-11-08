const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {validateEnquiry} = require('./site.js');
test('accepts legitimate synthetic enquiry without sending', () => {
  assert.equal(validateEnquiry({name:'Test Person',email:'test@example.com',message:'A sample project request'}),null);
});
test('rejects missing, invalid and oversized fields', () => {
  assert.ok(validateEnquiry({name:'',email:'a@b.com',message:'A long message'}));
  assert.ok(validateEnquiry({name:'Test',email:'not-email',message:'A long message'}));
  assert.ok(validateEnquiry({name:'Test',email:'a@b.com',message:'x'}));
  assert.ok(validateEnquiry({name:'Test',email:'a@b.com',message:'x'.repeat(1001)}));
});
test('rejects non-text inputs and invisible email spoofing',()=>{
  assert.ok(validateEnquiry({name:{toString(){throw Error('unexpected')}},email:'a@b.com',message:'Hello world'}));
  assert.ok(validateEnquiry({name:'Test',email:'n\u200bame@example.com',message:'A sample project request'}));
});
test('no network submission, inline JS or unsafe HTML sinks', () => {
  const html=fs.readFileSync('index.html','utf8');
  const js=fs.readFileSync('site.js','utf8');
  assert.match(html,/form-action 'none'/);
  assert.match(html,/<main id="main">/);
  assert.match(html,/role="status"/);
  assert.doesNotMatch(html,/<script(?![^>]*src=)[^>]*>/);
  assert.doesNotMatch(html,/<[a-z][^>]*\s+on[a-z]+\s*=/i);
  assert.doesNotMatch(js,/\b(fetch|XMLHttpRequest|sendBeacon|innerHTML|eval)\b/);
});

test('field-level error mapping for fictional inputs', () => {
  const {validateEnquiryFields} = require('./site.js');
  assert.equal(validateEnquiryFields({name:'',email:'test@example.com',message:'A fictional project'}).field,'name');
  assert.equal(validateEnquiryFields({name:'Test',email:'bad',message:'A fictional project'}).field,'email');
  assert.equal(validateEnquiryFields({name:'Test',email:'test@example.com',message:'short'}).field,'message');
  assert.equal(validateEnquiryFields({name:'Test',email:'test@example.com',message:'A fictional project'}).error,null);
});
test('feedback is associated with fields and remains local', () => {
  const html=fs.readFileSync('index.html','utf8');
  const js=fs.readFileSync('site.js','utf8');
  for (const key of ['name','email','message']) {
    assert.match(html,new RegExp('id="'+key+'-error"'));
    assert.match(html,new RegExp('aria-describedby="'+key+'-error"'));
  }
  assert.ok(js.includes('inputs[result.field].focus()'));
  assert.ok(js.includes('setAttribute("aria-invalid","true")'));
  assert.match(html,/Nothing has been checked yet/);
});

test('message error is a real sibling of an empty textarea', () => {
  const html = fs.readFileSync('index.html','utf8');
  assert.match(html, /<textarea\b[^>]*id="message"[^>]*><\/textarea>\s*<p class="field-error" id="message-error"><\/p>/);
  assert.doesNotMatch(html, /<textarea\b[^>]*>[^<]*<p[^>]*id="message-error"/);
});
test('control characters and non-text values focus the offending field', () => {
  const {validateEnquiryFields} = require('./site.js');
  const good = {name:'Test Person',email:'test@example.com',message:'A fictional project'};
  assert.equal(validateEnquiryFields({...good,name:'Test\u0001 Person'}).field,'name');
  assert.equal(validateEnquiryFields({...good,message:'A fictional\u0001 project'}).field,'message');
  assert.equal(validateEnquiryFields({...good,email:'test\u0001@example.com'}).field,'email');
  assert.equal(validateEnquiryFields({...good,message:42}).field,'message');
});

test('ordinary text is not mistaken for control characters', () => {
  const {validateEnquiryFields} = require('./site.js');
  const good = {name:'Test Person',email:'test@example.com',message:'A fictional project'};
  assert.deepEqual(validateEnquiryFields(good), {error:null,field:null});
  for (const field of ['name','email','message']) {
    const sample = {...good, [field]: good[field] + '\u0001'};
    const result = validateEnquiryFields(sample);
    assert.equal(result.field, field);
    assert.ok(result.error);
  }
});

test('editing one field preserves other invalid field feedback', () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  function node(value = '') {
    const attributes = new Map();
    const listeners = {};
    return {
      value, textContent: '', attributes, listeners, focused: false,
      setAttribute(key, val) { attributes.set(key, val); },
      getAttribute(key) { return attributes.get(key) ?? null; },
      removeAttribute(key) { attributes.delete(key); },
      addEventListener(type, fn) { listeners[type] = fn; },
      focus() { this.focused = true; }
    };
  }
  const inputs = {
    name: node('Test Person'),
    email: node('invalid-email'),
    message: node('A fictional project')
  };
  const errors = {name: node(), email: node(), message: node()};
  const feedback = node();
  const form = {
    elements: {namedItem(key) { return inputs[key]; }},
    addEventListener(type, fn) { this[type] = fn; }
  };
  const document = {
    getElementById(id) {
      if (id === 'enquiry') return form;
      if (id === 'feedback') return feedback;
      return errors[id.replace('-error', '')];
    }
  };
  vm.runInNewContext(fs.readFileSync('site.js', 'utf8'), {document});
  form.submit({preventDefault() {}});
  assert.equal(inputs.email.getAttribute('aria-invalid'), 'true');
  assert.ok(errors.email.textContent);
  assert.equal(inputs.email.focused, true);
  inputs.name.value = 'Changed Person';
  inputs.name.listeners.input();
  assert.equal(inputs.email.getAttribute('aria-invalid'), 'true');
  assert.ok(errors.email.textContent);
  assert.match(feedback.textContent, /correct the highlighted field/);
  inputs.email.value = 'valid@example.com';
  inputs.email.listeners.input();
  assert.equal(inputs.email.getAttribute('aria-invalid'), null);
  assert.equal(errors.email.textContent, '');
  assert.match(feedback.textContent, /Nothing has been checked yet/);
  form.submit({preventDefault() {}});
  assert.match(feedback.textContent, /Fields look valid/);
});
