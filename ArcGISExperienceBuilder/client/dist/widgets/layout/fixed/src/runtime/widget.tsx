/** @jsx jsx */
import { React, type AllWidgetProps, jsx } from 'jimu-core'
import { LayoutEntry } from 'jimu-layouts/layout-runtime'
import defaultMessages from './translations/default'
import { WidgetPlaceholder } from 'jimu-ui'

const IconImage = require('./assets/icon.svg')

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>> {
  render (): React.JSX.Element {
    const { layouts, id, intl, builderSupportModules } = this.props
    const LayoutComponent = !window.jimuConfig.isInBuilder
      ? LayoutEntry
      : builderSupportModules.widgetModules.LayoutBuilder

    if (LayoutComponent == null) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          No layout component!
        </div>
      )
    }
    const layoutName = Object.keys(layouts)[0]

    return (
      <div className='widget-fixed-layout d-flex w-100 h-100'>
        <LayoutComponent
          layouts={layouts[layoutName]} isInWidget style={{
            overflow: 'auto',
            minHeight: 'none'
          }}
        >
          <WidgetPlaceholder
            icon={IconImage} widgetId={id}
            style={{
              border: 'none'
            }}
            message={intl.formatMessage({ id: 'tips', defaultMessage: defaultMessages.tips })}
          />
        </LayoutComponent>
      </div>
    )
  }
}
