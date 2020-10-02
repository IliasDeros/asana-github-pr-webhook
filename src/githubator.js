var axios = require('axios')
const log = require('debug-with-levels')('agpw:githubator')

/**
 * All the http requests to github.
 */
module.exports.githubAccessToken = process.env.GITHUB_ACCESS_TOKEN

module.exports.addComment = async function (url, message) {
  log.trace('addComment')
  try {
    log.debug(url)
    var res = await axios.post(url, { 'body': message }, {
      'headers': { 'Authorization': 'token ' + module.exports.githubAccessToken }
    })
    log.debug(res)
  } catch (error) {
    log.error(error)
  }
}
