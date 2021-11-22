const hbjs = require('handbrake-js')
const path = require('path')
const cliProgress = require('cli-progress')
const fs = require('fs')

const { getFiles } = require('./list-files')

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .example('$0 -i c:\\convert -o c:\\videos -t .mkv .mp4 -p Normal')
  .options({
    'input': {
      type: 'string',
      desc: 'Input directory to read files from',
      alias: 'i',
      required: true
    },
    'output': {
      type: 'string',
      desc: 'Output directory to write files to',
      alias: 'o',
      required: true
    },
    'filetypes': {
      type: 'array',
      desc: 'Array with input and output filetypes',
      alias: 't',
      default: ['.mkv', '.mp4']
    },
    'preset': {
      type: 'string',
      desc: 'Handbrake preset to use',
      alias: 'p',
      default: 'Normal'
    },
    'help': {
      boolean: true,
      desc: 'Show help',
      alias: 'h'
    }
  })
  .argv

if (argv.help) {
  yargs.showHelp()
}

const getFiletypes = (filetypes) => {
  if (filetypes.length < 1) {
    return ['.mkv', '.mp4']
  } else if (filetypes.length < 2) {
    return [filetypes[0], '.mp4']
  } else {
    return filetypes
  }
}

const getOutputFile = ({ inputDirectory, inputFile, inputFiletype, outputFiletype, outputDirectory }) => {
  const newFile = inputFile.replace(inputDirectory, '').replace(inputFiletype, outputFiletype)
  return path.join(outputDirectory, newFile)
}

// Used if a subfolder doesn't exist 
const createSubFolder = (file) => {
  const dir = path.dirname(file) || ''
  if (dir !== '' && dir !== '.') {
    if (!fs.existsSync(dir)) {
      console.log(`Creating subfolders ${dir}`)
      fs.mkdirSync(dir, { recursive: true })
    }
  }
}

async function run(options, progressBar) {
  return new Promise((resolve, reject) => {
    hbjs.spawn(options)
      .on('begin', () => {
        progressBar.start(100, 0)
      })
      .on('error', err => {
        progressBar.stop()
        reject(err)
      })
      .on('progress', progress => {
        //console.log(`Percent complete: ${progress.percentComplete}, ETA: ${progress.eta}`)
        progressBar.update(progress.percentComplete)
      })
      .on('end', () => {
        progressBar.stop()
        resolve()
      })
  })
}

async function convert(inputDirectory, outputDirectory, filetypes) {

  const files = getFiles(inputDirectory, filetypes[0])

  console.log(`Converting ${files.length} videos`)

  let index = 0
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

  for (let i = 0; i < files.length; i++) {
    const file = path.normalize(files[i])
    const options = {
      input: file,
      output: getOutputFile({
        inputDirectory,
        inputFile: file,
        inputFiletype: filetypes[0],
        outputFiletype: filetypes[1],
        outputDirectory
      })
    }

    //Create subfolders if they don't exist
    createSubFolder(options.output)

    console.log(`Starting conversion of ${options.input} to ${options.output}`)
    await run(options, progressBar)
  }

  console.log('Completed!')
}


convert(path.normalize(argv.input), path.normalize(argv.output), getFiletypes(argv.filetypes)).catch(err => {
  console.error(err)
})

