/** @jsx jsx */
import { React, jsx, hooks } from 'jimu-core'
import { defaultMessages as jimuUIMessages, Switch } from 'jimu-ui'
import { SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import defaultMessages from '../translations/default'
import type {  IMConfig } from '../../config'

interface MapModeToolProps {
  config: IMConfig
  onPropertyChange: (name: string, value: any) => void
}

const LayerModeTool = (props: MapModeToolProps) => {
  const { config, onPropertyChange } = props
  const { enableAttachments } = config
  const translate = hooks.useTranslation(defaultMessages, jimuUIMessages)

  return <SettingSection
    role='group'
    title={translate('tools')}
    aria-label={translate('tools')}
  >
    <SettingRow tag='label' label={translate('enableAttachments')} >
      <Switch
        className='can-x-switch'
        checked={enableAttachments}
        data-key='enableAttachments'
        onChange={(evt) => { onPropertyChange('enableAttachments', evt.target.checked) }}
        aria-label={translate('enableAttachments')}
      />
    </SettingRow>
  </SettingSection>
}

export default LayerModeTool
