// Drives the embedded/native sign-in flow against POST /flow/sign-in (handleFlow() from
// @thunderid/express). No SDK UI components are shipped for Express, so this renders the
// flow's server-driven `components` directly — the same shape @thunderid/react and
// @thunderid/vue's SignIn components consume, just hand-rolled here.
;(function () {
  var root = document.getElementById('native-login-root')
  if (!root) return

  var applicationId = root.getAttribute('data-application-id')
  var state = { authId: null, executionId: null, challengeToken: null }

  function escapeHtml(str) {
    if (str == null) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /** Recursively collects TEXT_INPUT/PASSWORD_INPUT/EMAIL_INPUT fields from a component tree. */
  function collectFields(components) {
    var fields = []
    ;(components || []).forEach(function (c) {
      if (c.type === 'TEXT_INPUT' || c.type === 'PASSWORD_INPUT' || c.type === 'EMAIL_INPUT') {
        fields.push(c)
      }
      if (c.components) fields = fields.concat(collectFields(c.components))
    })
    return fields
  }

  /** Recursively finds the first SUBMIT-type ACTION component. */
  function findSubmitAction(components) {
    for (var i = 0; i < (components || []).length; i++) {
      var c = components[i]
      if (c.type === 'ACTION' && (c.eventType || '').toUpperCase() === 'SUBMIT') return c
      if (c.components) {
        var found = findSubmitAction(c.components)
        if (found) return found
      }
    }
    return null
  }

  function renderError(message) {
    var el = root.querySelector('.native-login-error')
    if (!el) return
    el.hidden = !message
    el.textContent = message || ''
  }

  function renderStep(components) {
    var fields = collectFields(components)
    var submitAction = findSubmitAction(components)

    var fieldsHtml = fields
      .map(function (f) {
        var type = f.type === 'PASSWORD_INPUT' ? 'password' : f.type === 'EMAIL_INPUT' ? 'email' : 'text'
        return (
          '<div class="native-login-field">' +
          '<label for="field-' + escapeHtml(f.ref) + '">' + escapeHtml(f.label || f.ref) + '</label>' +
          '<input type="' + type + '" id="field-' + escapeHtml(f.ref) + '" name="' + escapeHtml(f.ref) + '"' +
          ' placeholder="' + escapeHtml(f.placeholder || '') + '"' +
          (f.required ? ' required' : '') +
          ' />' +
          '</div>'
        )
      })
      .join('')

    root.innerHTML =
      '<div class="native-login-error" hidden></div>' +
      '<form id="native-login-form">' +
      fieldsHtml +
      '<button type="submit" class="btn-primary" style="width:100%;margin-top:8px">' +
      escapeHtml((submitAction && submitAction.label) || 'Continue') +
      '</button>' +
      '</form>'

    var form = document.getElementById('native-login-form')
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var inputs = {}
      fields.forEach(function (f) {
        inputs[f.ref] = document.getElementById('field-' + f.ref).value
      })
      submitStep(inputs)
    })
  }

  function handleResponse(data) {
    if (data.done) {
      window.location.href = data.redirectUrl
      return
    }
    state.authId = data.authId ?? state.authId
    state.executionId = data.executionId
    state.challengeToken = data.challengeToken
    renderStep(data.components || [])
  }

  function postFlow(payload) {
    renderError(null)
    return fetch('/flow/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Sign-in failed.')
          return data
        })
      })
      .then(handleResponse)
      .catch(function (err) {
        renderError(err.message || 'Sign-in failed. Please try again.')
      })
  }

  function submitStep(inputs) {
    postFlow({
      authId: state.authId,
      executionId: state.executionId,
      challengeToken: state.challengeToken,
      inputs: inputs,
    })
  }

  postFlow({ applicationId: applicationId, flowType: 'AUTHENTICATION' })
})()
