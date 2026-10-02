import {
  defaultInstallationTemplate,
  generateSourceHTMLUsageCode,
  installationHtmlEntrySetup,
  installationHtmlPlayerPageCode,
  installationProjectFiles,
} from '@videojs/installation';

import ClientCode from '@/components/Code/ClientCode';
import { focusLinesContaining } from '@/components/Code/focusLines';
import { useRegistryFramework } from '@/components/installation/useRegistryFramework';
import { withSelectionMarker } from '@/components/installation/withSelectionMarker';
import { Tab, TabsList, TabsPanel, TabsRoot } from '@/components/Tabs';
import { shared } from '@/components/typography/styles';

import { useSelection } from '../installation/useSelection';

type SourceHTMLPlayerPart = 'imports' | 'media' | 'player';

interface Props {
  part: SourceHTMLPlayerPart;
}

interface CodeTab {
  code: string;
  focusLines?: readonly number[];
  label: string;
  lang: 'html' | 'js' | 'json' | 'ts';
  value: string;
}

function CodeTabs({ label, tabs }: { label: string; tabs: readonly CodeTab[] }) {
  return (
    <TabsRoot maxWidth={false}>
      <TabsList label={label}>
        {tabs.map((tab, index) => (
          <Tab key={tab.value} value={tab.value} initial={index === 0}>
            {tab.label}
          </Tab>
        ))}
      </TabsList>
      {tabs.map((tab, index) => (
        <TabsPanel key={tab.value} value={tab.value} initial={index === 0}>
          <ClientCode code={tab.code} focusLines={tab.focusLines} lang={tab.lang} />
        </TabsPanel>
      ))}
    </TabsRoot>
  );
}

function SourceHTMLPlayer({ part }: Props) {
  const framework = useRegistryFramework('html');
  const template = useSelection('template', defaultInstallationTemplate(framework));
  const useCase = useSelection('useCase');
  const startingPoint = useSelection('project');
  const project = installationProjectFiles(framework, template, useCase);
  const options = {
    useCase,
    media: useSelection('media'),
    extensions: useSelection('extensions'),
    sourceUrl: useSelection('sourceUrl'),
    componentsAlias: project.componentsAlias,
    componentsDirectory: project.componentsDirectory,
  };
  const html = generateSourceHTMLUsageCode(options);

  if (part === 'media') {
    return (
      <>
        <p className={`${shared.p} ${shared.prose}`}>
          The skin path below assumes the <code>{project.componentsAlias}</code> components alias. If{' '}
          <code>aliases.components</code> in <code>components.json</code> differs, the skin is under that alias&apos;s
          directory instead.
        </p>
        <p className={`${shared.p} ${shared.prose}`}>
          In <code>{html.skinFile}</code>, replace the “Add a compatible media component here” comment with:
        </p>
        <CodeTabs
          label="Skin source"
          tabs={[{ code: html.media, label: html.skinFile, lang: 'html', value: 'skin' }]}
        />
        {html.container && (
          <>
            <p className={`${shared.p} ${shared.prose}`}>
              Then size the video on the skin&apos;s root container: replace its opening{' '}
              <code>{html.container.anchor}</code> with:
            </p>
            <CodeTabs
              label="Skin layout"
              tabs={[{ code: html.container.code, label: html.skinFile, lang: 'html', value: 'layout' }]}
            />
          </>
        )}
      </>
    );
  }

  if (part === 'imports') {
    const entrySetup = installationHtmlEntrySetup(template, project.usage!);

    return (
      <>
        {entrySetup.map((block) => (
          <div key={block.filename}>
            <p className={`${shared.p} ${shared.prose}`}>
              Merge the player entry into <code>{block.filename}</code>, keeping its other inputs, plugins, and options:
            </p>
            <CodeTabs
              label="App configuration"
              tabs={[
                {
                  code: block.code,
                  focusLines: focusLinesContaining(block.code, [
                    'import ',
                    'plugins:',
                    'input:',
                    'laravel({',
                    'resolve:',
                    'alias:',
                  ]),
                  label: block.filename,
                  lang: block.language,
                  value: 'entry',
                },
              ]}
            />
          </div>
        ))}
        <p className={`${shared.p} ${shared.prose}`}>
          Create <code>{project.usage}</code> and import the player, media, and installed skin:
        </p>
        <CodeTabs
          label="HTML implementation"
          tabs={[{ code: html.imports, label: project.usage!, lang: 'ts', value: 'imports' }]}
        />
        <p className={`${shared.p} ${shared.prose}`}>
          Use the <code>aliases.components</code> value from <code>components.json</code> in the skin import when it
          differs from <code>{project.componentsAlias}</code>.
        </p>
      </>
    );
  }

  return (
    <>
      <p className={`${shared.p} ${shared.prose}`}>
        Paste the updated skin markup inside the player, then load the entry module:
      </p>
      <CodeTabs
        label="HTML implementation"
        tabs={[
          {
            code: installationHtmlPlayerPageCode(html.player, template, project.usage!, startingPoint),
            label: project.player,
            lang: 'html',
            value: 'player',
          },
        ]}
      />
    </>
  );
}

export default withSelectionMarker(SourceHTMLPlayer);
