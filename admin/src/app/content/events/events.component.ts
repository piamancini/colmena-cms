import { Component, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'

import { UiService } from '@colmena/colmena-angular-ui'

import { EventsService } from './events.service'

@Component({
  selector: 'app-content-events',
  template: `
    <ui-modal-form #form>
      <ui-form [config]="formConfig" [item]="item" (action)="action($event)"></ui-form>
    </ui-modal-form>

    <ui-modal-form #view>
      <app-content-event [item]="item"></app-content-event>
    </ui-modal-form>

    <template #iconTemplate let-item="item">
      <div class="card-block" style="min-height: 200px">
        <h6 style="text-decoration: underline; cursor: pointer;" (click)="action({ action: 'view', item: item })">
          <i class="icon-event"></i> {{item.name}}
        </h6>
        <div class="text-muted" *ngIf="item.date">Date: {{item.date | date: 'short' }}</div>
        <div class="text-muted" *ngIf="item.location">Location {{item.location}}</div>
      </div>
    </template>

    <ui-data-grid #grid (action)="action($event)" [iconTemplate]="iconTemplate" [service]="service"></ui-data-grid>
  `,
})
export class EventsComponent {

  @ViewChild('grid') private grid
  @ViewChild('form') private form
  @ViewChild('view') private view

  public item: any = {}
  public formConfig: any = {}

  constructor(
    public service: EventsService,
    public uiService: UiService,
    private route: ActivatedRoute,
  ) {
    this.service.domain = this.route.snapshot.data['domain']
    this.service.getFiles()
    this.formConfig = this.service.getFormConfig()
  }

  save(item): void {
    this.service.upsertItem(
      item,
      (res) => {
        this.uiService.toastSuccess('Event saved', res.name)
        this.form.hide()
        this.grid.refreshData()
      },
      err => console.error(err)
    )
  }

  action(event) {
    switch (event.action) {
      case 'edit':
        this.item = Object.assign({}, event.item)
        this.form.title = `Edit: ${this.item.name}`
        this.form.show()
        break
      case 'add':
        this.item = Object.assign({}, { name: null, description: null, location: null, date: null })
        this.form.title = 'Add Event'
        this.form.show()
        break
      case 'view':
        this.item = Object.assign({}, event.item)
        this.view.show()
        break
      case 'cancel':
        this.form.hide()
        break
      case 'save':
        this.save(event.item)
        break
      case 'delete':
        const successCb = () => this.service
          .deleteItem(event.item,
            () => this.grid.refreshData(),
            (err) => this.uiService.toastError('Error deleting item', err.message))
        const question = { title: 'Are you sure?', text: 'The action can not be undone.' }
        this.uiService.alertQuestion( question, successCb, () => ({}) )
        break
      default:
        console.log('Unknown event action', event)
        break
    }
  }

}
