const github = require('./github')
const asana = require('./asana')
const log = require('debug-with-levels')('agpw:processor')

async function updateAsanaAndGithub (opts) {
  const { asanaData, githubData, replacementAsanator, replacementGithubator } = opts

  if (!asanaData) {
    return
  }

  var parsedGithubData = {
    url: githubData.pull_request.html_url,
    commentsUrl: `${githubData.pull_request.issue_url}/comments`,
    title: githubData.pull_request.title
  }

  // put github link on asana
  await asana.addGithubPrToAsanaTask(parsedGithubData, asanaData, replacementAsanator)

  // put asana link on github
  await github.addAsanaTaskToGithubPr(parsedGithubData, asanaData, replacementGithubator)
}

module.exports.processWebhook = async function (data, replacementAsanator, replacementGithubator) {
  log.trace('processWebhook')
  if (!github.shouldProcess(data)) {
    log.info('skipping as PR either is edited, or body doesnt have a valid asana task url')
    return
  }

  // get asana task id
  var asanaId = github.getAsanaIdFromUrlInDescription(data)
  log.debug('Found asana id: ' + asanaId)

  // get real asana task
  var asanaData = await asana.getAsanaTask(asanaId, replacementAsanator)
  log.debug('Found asana task: ' + JSON.stringify(asanaData))

  await updateAsanaAndGithub({ asanaData, githubData: data, replacementAsanator, replacementGithubator })
}

module.exports.processWebhook4Digits = async function (data, replacementAsanator, replacementGithubator) {
  log.trace('processWebhook4Digits')
  if (!github.shouldProcess4digits(data)) {
    log.info('skipping as no change')
    return
  }

  // get asana prefix id
  var asanaId = github.getAsanaId(data)
  log.debug('Found asana id: ' + asanaId)

  // get real asana id
  var asanaData = await asana.getMatchingAsanaTask(asanaId, replacementAsanator)
  log.debug('Found asana task: ' + JSON.stringify(asanaData))

  await updateAsanaAndGithub({ asanaData, githubData: data, replacementAsanator, replacementGithubator })
}
