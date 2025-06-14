import { React, hooks } from 'jimu-core'
import { WidgetPlaceholder } from 'jimu-ui'
import defaultMessages from '../translations/default'
const navigatorIcon = require('jimu-ui/lib/icons/navigator.svg')

interface PlaceholderProps {
  show?: boolean
  widgetId: string
  message: string
}

export const Placeholder = (props: PlaceholderProps) => {
  const { widgetId, show, message } = props

  const translate = hooks.useTranslation(defaultMessages)

  return show
    ? <WidgetPlaceholder
      icon={navigatorIcon}
      widgetId={widgetId}
      message={translate(message)} />
    : null
}
