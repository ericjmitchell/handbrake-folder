const glob = require("glob");
const path = require('path')

function getFiles (src, filetype) {
  if (!filetype.startsWith('.') && filetype !== '') {
    throw new Error('filetype must begin with a .')
  }

  return glob.sync(`${src}/**/*${filetype}`)
};

module.exports = {
  getFiles
}