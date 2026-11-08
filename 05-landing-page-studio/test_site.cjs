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
  assert.ok(js.includes('inputs[invalidFields[0]].focus()'));
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
  assert.match(feedback.textContent, /All highlighted errors are resolved\. Validate again/);
  form.submit({preventDefault() {}});
  assert.match(feedback.textContent, /Fields look valid/);
});

test('all invalid fields are reported together, in document order', () => {
  const {validateEnquiryAllFields, validateEnquiryFields} = require('./site.js');
  const bad = {name:'',email:'invalid-email',message:'short'};
  const errors = validateEnquiryAllFields(bad);
  assert.deepEqual(Object.keys(errors), ['name','email','message']);
  assert.match(errors.name, /name/);
  assert.match(errors.email, /email/);
  assert.match(errors.message, /summary/);
  assert.equal(validateEnquiryFields(bad).field, 'name');
  assert.deepEqual(validateEnquiryAllFields({
    name:'Test Person',email:'test@example.com',message:'A fictional project'
  }), {});
  assert.deepEqual(Object.keys(validateEnquiryAllFields({
    name:'Test\u0001 Person',email:'test\u200b@example.com',message:'A fictional\u0002 project'
  })), ['name','email','message']);
});

test('submit renders all errors, focuses first, and preserves untouched errors', () => {
  const vm = require('node:vm');
  function node(value = '') {
    const attributes = new Map();
    const listeners = {};
    return {
      value, textContent:'', listeners, focused:false,
      setAttribute(key, val) { attributes.set(key,val); },
      getAttribute(key) { return attributes.get(key) ?? null; },
      removeAttribute(key) { attributes.delete(key); },
      addEventListener(type, fn) { listeners[type] = fn; },
      focus() { this.focused = true; }
    };
  }
  const inputs = {name:node(''),email:node('bad'),message:node('short')};
  const errors = {name:node(),email:node(),message:node()};
  const feedback = node();
  const form = {
    elements:{namedItem(key) {return inputs[key];}},
    addEventListener(type, fn) {this[type] = fn;}
  };
  const document = {
    getElementById(id) {
      if (id === 'enquiry') return form;
      if (id === 'feedback') return feedback;
      return errors[id.replace('-error','')];
    }
  };
  vm.runInNewContext(fs.readFileSync('site.js','utf8'), {document});
  form.submit({preventDefault() {}});
  for (const key of ['name','email','message']) {
    assert.equal(inputs[key].getAttribute('aria-invalid'), 'true');
    assert.ok(errors[key].textContent);
  }
  assert.equal(inputs.name.focused,true);
  assert.match(feedback.textContent,/Nothing was sent/);
  inputs.name.value = 'Test Person';
  inputs.name.listeners.input();
  assert.equal(inputs.name.getAttribute('aria-invalid'),null);
  assert.equal(inputs.email.getAttribute('aria-invalid'),'true');
  assert.equal(inputs.message.getAttribute('aria-invalid'),'true');
  inputs.email.value = 'test@example.com';
  inputs.message.value = 'A fictional project';
  inputs.email.listeners.input();
  inputs.message.listeners.input();
  form.submit({preventDefault() {}});
  assert.match(feedback.textContent,/Fields look valid/);
});

test('summary uses singular/plural while errors recover from three to zero', () => {
  const vm = require('node:vm');
  function node(value = '') {
    const attributes = new Map(), listeners = {};
    return {
      value, textContent: '', listeners,
      setAttribute(k,v) { attributes.set(k,v); },
      getAttribute(k) { return attributes.get(k) ?? null; },
      removeAttribute(k) { attributes.delete(k); },
      addEventListener(k,fn) { listeners[k] = fn; },
      focus() { this.focused = true; }
    };
  }
  const inputs = {name:node(''),email:node('bad'),message:node('short')};
  const errors = {name:node(),email:node(),message:node()};
  const feedback = node();
  const form = {
    elements:{namedItem(k) { return inputs[k]; }},
    addEventListener(k,fn) { this[k] = fn; }
  };
  const document = {getElementById(id) {
    if (id === 'enquiry') return form;
    if (id === 'feedback') return feedback;
    return errors[id.replace('-error','')];
  }};
  vm.runInNewContext(fs.readFileSync('site.js','utf8'),{document});
  form.submit({preventDefault() {}});
  assert.match(feedback.textContent,/highlighted fields/);
  assert.equal(inputs.name.focused,true);
  inputs.name.value = 'Fictional Person';
  inputs.name.listeners.input();
  assert.match(feedback.textContent,/highlighted fields/);
  assert.equal(inputs.email.getAttribute('aria-invalid'),'true');
  inputs.email.value = 'fictional@example.com';
  inputs.email.listeners.input();
  assert.match(feedback.textContent,/highlighted field\./);
  assert.doesNotMatch(feedback.textContent,/highlighted fields/);
  assert.equal(inputs.message.getAttribute('aria-invalid'),'true');
  inputs.message.value = 'A fictional project request';
  inputs.message.listeners.input();
  assert.match(feedback.textContent,/All highlighted errors are resolved\. Validate again/);
  assert.match(fs.readFileSync('index.html','utf8'), /id="feedback" role="status" aria-live="polite"/);
  form.submit({preventDefault() {}});
  assert.match(feedback.textContent,/Fields look valid/);
  assert.doesNotMatch(feedback.textContent,/was sent\.$/);
});


test('decorative hero artwork is hidden without inventing an image description', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /<div class="illustration" aria-hidden="true">MW<span>STUDIO 01<\/span><\/div>/);
  assert.doesNotMatch(html, /role="img"|aria-label="Decorative illustration of a clean workshop/);
  assert.match(html, /<h1 id="hero-title">/);
});


test('live feedback keeps one stable status role during validation', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const js = fs.readFileSync('site.js', 'utf8');
  assert.match(html, /id="feedback" role="status" aria-live="polite"/);
  assert.doesNotMatch(js, /feedback\.setAttribute\(["']role["']/);
  assert.match(js, /inputs\[invalidFields\[0\]\]\.focus\(\)/);
  assert.match(js, /errorSummary\(remainingErrors\.length\)/);
});

// Accessibility contract: status updates are announced as complete messages.
test('local validation feedback is an atomic polite status region', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /id="feedback" role="status" aria-live="polite" aria-atomic="true"/);
  assert.doesNotMatch(html, /id="feedback"[^>]*role="alert"/);
});

test('editing a still-invalid field retains its error until corrected', () => {
  const vm = require('node:vm');
  function node(value = '') {
    const attributes = new Map(), listeners = {};
    return {
      value, textContent: '', listeners,
      setAttribute(k,v) { attributes.set(k,v); },
      getAttribute(k) { return attributes.get(k) ?? null; },
      removeAttribute(k) { attributes.delete(k); },
      addEventListener(k,fn) { listeners[k] = fn; },
      focus() { this.focused = true; }
    };
  }
  const inputs = {name:node(''),email:node('bad'),message:node('short')};
  const errors = {name:node(),email:node(),message:node()};
  const feedback = node();
  const form = {
    elements:{namedItem(k) { return inputs[k]; }},
    addEventListener(k,fn) { this[k] = fn; }
  };
  const document = {getElementById(id) {
    if (id === 'enquiry') return form;
    if (id === 'feedback') return feedback;
    return errors[id.replace('-error','')];
  }};
  vm.runInNewContext(fs.readFileSync('site.js','utf8'),{document});
  form.submit({preventDefault() {}});
  inputs.email.value = 'still-invalid';
  inputs.email.listeners.input();
  assert.equal(inputs.email.getAttribute('aria-invalid'),'true');
  assert.match(errors.email.textContent,/valid email/);
  assert.match(feedback.textContent,/highlighted fields/);
  inputs.email.value = 'fictional@example.com';
  inputs.email.listeners.input();
  assert.equal(inputs.email.getAttribute('aria-invalid'),null);
  assert.equal(errors.email.textContent,'');
  assert.equal(inputs.name.getAttribute('aria-invalid'),'true');
  assert.equal(inputs.message.getAttribute('aria-invalid'),'true');
});

// The untouched form must not imply that validation already occurred.
test('untouched form retains initial feedback while corrected form requests revalidation', () => {
  const source = fs.readFileSync('site.js', 'utf8');
  assert.match(fs.readFileSync('index.html','utf8'), /Nothing has been checked yet/);
  assert.match(source, /let hasAttemptedValidation = false/);
  assert.match(source, /hasAttemptedValidation = true/);
  assert.match(source, /All highlighted errors are resolved\. Validate again/);
});
