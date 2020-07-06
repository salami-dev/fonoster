import '../../config'
import AppManager from '@fonos/appmanager'
import truncate from 'truncate'
import { CLIError } from '@oclif/errors'
import { Command, flags } from '@oclif/command'
import moment from 'moment'
import { prompt } from 'inquirer'
import { View } from '../../../../core/src/server/protos/common_pb'
const Table = require('easy-table')

export default class ListCommand extends Command {
  static aliases = ['apps:ls']
  static description = `list registered applications
  ...
  List the registered applications
  `
  static flags = {
    size: flags.integer({
      char: 's',
      default: 25,
      description: 'number of result per page'
    })
  }

  async run () {
    const { flags } = this.parse(ListCommand)
    try {
      const appmanager = new AppManager()
      let firstBatch = true
      let pageToken = '0'
      const view: View = View.BASIC
      const pageSize = flags.size
      while (true) {
        // Get a list
        const result = await appmanager.listApps({ pageSize, pageToken, view })
        const apps = result.getAppsList()
        pageToken = result.getNextPageToken()

        // Dont ask this if is the first time or empty data
        if (apps.length > 0 && !firstBatch) {
          const answer: any = await prompt([
            { name: 'q', message: 'More', type: 'confirm' }
          ])
          if (!answer.q) break
        }

        const t = new Table()

        apps.forEach((app: any) => {
          t.cell('Name', app.getName())
          t.cell('Description', truncate(app.getDescription(), 32))
          t.cell('Created', moment(app.getCreateTime()).fromNow())
          t.cell('Updated', moment(app.getCreateTime()).fromNow())
          t.newRow()
        })

        if (apps.length > 0) console.log(t.toString())

        firstBatch = false
        if (!pageToken) break
      }
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}