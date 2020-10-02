const github = require('./github')
var githubator = require('./githubator')

it('add comment to github', async () => {
  var githubData = {
    commentsUrl: 'https://api.github.com/repos/codeallthethingz/asana-github-pr-webhook/issues/2/comments'
  }
  var asanaData = {
    gid: '12341234',
    name: 'some kinda title'
  }

  githubator.githubAccessToken = 'temp'
  githubator.addComment = async function (apiUrl, comment) {
    expect(apiUrl).toEqual(githubData.commentsUrl)
    expect(comment).toContain('<a href="https://app.asana.com/0/0/12341234">https://app.asana.com/0/0/12341234</a>')
  }
  await github.addAsanaTaskToGithubPr(githubData, asanaData, githubator)
})

test('webhook id in name 4 chars or longer', () => {
  var baseData = {
    'action': 'closed',
    'number': 1,
    'pull_request': {
      'url': 'https://api.github.com/repos/Codertocat/Hello-World/pulls/1',
      'title': 'Update the README with new information',
      'body': 'a description'
    },
    'changes': {
      'title': { 'from': 'something' },
      'body': { 'from': 'something' }
    }
  }

  baseData.pull_request.title = '1234 something'
  expect(github.getAsanaId(baseData)).toEqual('1234')

  baseData.pull_request.title = '1234 something'
  expect(github.getAsanaId(baseData)).toEqual('1234')

  baseData.pull_request.title = 'something 1234'
  expect(github.getAsanaId(baseData)).toEqual(null)

  baseData.pull_request.title = '12345 something'
  expect(github.getAsanaId(baseData)).toEqual('12345')

  baseData.pull_request.title = 'something'
  baseData.pull_request.body = '12345 something'
  expect(github.getAsanaId(baseData)).toEqual('12345')

  baseData.pull_request.title = '123 something'
  baseData.pull_request.body = ''
  expect(github.getAsanaId(baseData)).toEqual(null)
})

describe('should process', () => {
  var baseData

  beforeEach(() => {
    baseData = {
      'action': 'opened',
      'number': 1,
      'pull_request': {
        'url': 'https://api.github.com/repos/Codertocat/Hello-World/pulls/1',
        'title': 'Update the README with new information',
        'body': '[Asana Task](https://app.asana.com/0/1186519733333322/1195801022222226/f) description'
      }
    }
  })

  test('should process a valid opened PR', () => {
    expect(github.shouldProcess(baseData)).toBeTruthy()
  })

  test('should process a valid opened PR with trailing /', () => {
    baseData.pull_request.body = '[Asana Task](https://app.asana.com/0/1186519733333322/1195801022222226/) description'
    expect(github.shouldProcess(baseData)).toBeTruthy()
  })

  test('should process a valid opened PR without trailing /f', () => {
    baseData.pull_request.body = '[Asana Task](https://app.asana.com/0/1186519733333322/1195801022222226) description'
    expect(github.shouldProcess(baseData)).toBeTruthy()
  })

  test('should not process edited', () => {
    baseData.action = 'edited'
    expect(github.shouldProcess(baseData)).toBeFalsy()
  })

  test('should not process a description with no asana link', () => {
    baseData.pull_request.body = 'just the description'
    expect(github.shouldProcess(baseData)).toBeFalsy()
  })

  test('should not process a description with no asana ID', () => {
    baseData.pull_request.body = 'https://app.asana.com/'
    expect(github.shouldProcess(baseData)).toBeFalsy()
  })

  test('should not process a description with invalid asana ID', () => {
    baseData.pull_request.body = 'https://app.asana.com/invalid'
    expect(github.shouldProcess(baseData)).toBeFalsy()
  })
})

test('should process 4 digits', () => {
  var baseData = {
    'action': 'edited',
    'number': 1,
    'pull_request': {
      'url': 'https://api.github.com/repos/Codertocat/Hello-World/pulls/1',
      'title': 'Update the README with new information',
      'body': 'a description'
    },
    'changes': {
      'title': { 'from': 'something' },
      'body': { 'from': 'something' }
    }
  }

  baseData.pull_request.title = '1234 something'
  expect(github.shouldProcess4digits(baseData)).toEqual(true)

  baseData.pull_request.title = '1234 something'
  baseData.changes.title.from = '1234 xxoc'
  expect(github.shouldProcess4digits(baseData)).toEqual(false)

  baseData.pull_request.title = '1234 somethin'
  baseData.changes.title.from = '1234 something'
  expect(github.shouldProcess4digits(baseData)).toEqual(false)

  baseData.pull_request.title = '1234 something'
  baseData.changes.title.from = '1235 xxoc'
  expect(github.shouldProcess4digits(baseData)).toEqual(true)

  baseData.changes.title.from = null
  baseData.changes.body.from = null
  expect(github.shouldProcess4digits(baseData)).toEqual(false)

  baseData.pull_request.title = '1234 something'
  baseData.changes.title.from = '1235 xxoc'
  baseData.action = 'edited'
  expect(github.shouldProcess4digits(baseData)).toEqual(true)

  baseData.action = 'closed'
  expect(github.shouldProcess4digits(baseData)).toEqual(false)

  baseData.action = 'processed'
  baseData.pull_request.title = '1234 something'
  baseData.changes.title.from = '1235 xxoc'
  expect(github.shouldProcess4digits(baseData)).toEqual(false)

  baseData.action = 'opened'
  baseData.pull_request.title = '1234 something'
  expect(github.shouldProcess4digits(baseData)).toEqual(true)

  baseData.action = 'opened'
  baseData.pull_request.title = 'no id something'
  baseData.pull_request.body = '1234 id something'
  expect(github.shouldProcess4digits(baseData)).toEqual(true)

  baseData.action = 'processed'
  baseData.pull_request.title = 'no id something'
  baseData.pull_request.body = '1234 id something'
  expect(github.shouldProcess4digits(baseData)).toEqual(false)

  baseData.pull_request.title = 'no id something'
  baseData.pull_request.body = '1234 something'
  baseData.changes.body.from = '1235 xxoc'
  baseData.action = 'edited'
  expect(github.shouldProcess4digits(baseData)).toEqual(true)

  baseData.changes.title.from = null
  baseData.pull_request.title = 'nothin'
  baseData.pull_request.body = '1234 somethin'
  baseData.changes.body.from = '1234 something'
  expect(github.shouldProcess4digits(baseData)).toEqual(false)
})
