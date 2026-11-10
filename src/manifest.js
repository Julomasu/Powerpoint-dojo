// Fabrique le manifest.xml de l'add-in pour une adresse donnée.
// ⚠ L'identifiant de l'add-in hébergé (HOSTED_ID) et l'adresse du site ne doivent JAMAIS changer une fois publiés :
// un add-in déjà installé casserait. Ils sont propres à PowerPoint Dojo (différents de ceux de l'Excel Dojo).
export const HOSTED_ID = "b2fa4576-8f07-4610-a63b-d11a00670a8f";
export const HOSTED_URL = "https://slidesdojo.vercel.app/"; // adresse définitive du site (projet Vercel « slidesdojo ») : ne plus la changer
export const DEV_ID = "0d3a7c52-5e1b-4c8e-9a64-2f7b1d3c8e05"; // add-in de test local (https://localhost:3000)

export const buildManifest = (base, id = HOSTED_ID) => `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
           xmlns:ov="http://schemas.microsoft.com/office/taskpaneappversionoverrides"
           xsi:type="TaskPaneApp">
  <Id>${id}</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>PowerPoint Dojo</ProviderName>
  <DefaultLocale>fr-FR</DefaultLocale>
  <DisplayName DefaultValue="PowerPoint Dojo"/>
  <Description DefaultValue="Entraîne-toi sur PowerPoint, de débutant à champion du monde, directement dans ta présentation."/>
  <IconUrl DefaultValue="${base}assets/icon-32.png"/>
  <HighResolutionIconUrl DefaultValue="${base}assets/icon-64.png"/>
  <SupportUrl DefaultValue="${base}"/>
  <AppDomains>
    <AppDomain>${new URL(base).origin}</AppDomain>
  </AppDomains>
  <Hosts>
    <Host Name="Presentation"/>
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue="${base}index.html"/>
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
  <VersionOverrides xmlns="http://schemas.microsoft.com/office/taskpaneappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Hosts>
      <Host xsi:type="Presentation">
        <DesktopFormFactor>
          <GetStarted>
            <Title resid="GetStarted.Title"/>
            <Description resid="GetStarted.Description"/>
            <LearnMoreUrl resid="Url.Home"/>
          </GetStarted>
          <ExtensionPoint xsi:type="PrimaryCommandSurface">
            <OfficeTab id="TabHome">
              <Group id="DojoGroup">
                <Label resid="Group.Label"/>
                <Icon>
                  <bt:Image size="16" resid="Icon.16"/>
                  <bt:Image size="32" resid="Icon.32"/>
                  <bt:Image size="80" resid="Icon.80"/>
                </Icon>
                <Control xsi:type="Button" id="DojoButton">
                  <Label resid="Button.Label"/>
                  <Supertip>
                    <Title resid="Button.Label"/>
                    <Description resid="Button.Tip"/>
                  </Supertip>
                  <Icon>
                    <bt:Image size="16" resid="Icon.16"/>
                    <bt:Image size="32" resid="Icon.32"/>
                    <bt:Image size="80" resid="Icon.80"/>
                  </Icon>
                  <Action xsi:type="ShowTaskpane">
                    <TaskpaneId>PptDojoPane</TaskpaneId>
                    <SourceLocation resid="Url.Taskpane"/>
                  </Action>
                </Control>
              </Group>
            </OfficeTab>
          </ExtensionPoint>
        </DesktopFormFactor>
      </Host>
    </Hosts>
    <Resources>
      <bt:Images>
        <bt:Image id="Icon.16" DefaultValue="${base}assets/icon-16.png"/>
        <bt:Image id="Icon.32" DefaultValue="${base}assets/icon-32.png"/>
        <bt:Image id="Icon.80" DefaultValue="${base}assets/icon-80.png"/>
      </bt:Images>
      <bt:Urls>
        <bt:Url id="Url.Home" DefaultValue="${base}"/>
        <bt:Url id="Url.Taskpane" DefaultValue="${base}index.html"/>
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="Group.Label" DefaultValue="PowerPoint Dojo"/>
        <bt:String id="Button.Label" DefaultValue="Ouvrir le Dojo"/>
        <bt:String id="GetStarted.Title" DefaultValue="Bienvenue au Dojo"/>
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="Button.Tip" DefaultValue="Ouvre le volet d'entraînement PowerPoint Dojo."/>
        <bt:String id="GetStarted.Description" DefaultValue="Clique sur « Ouvrir le Dojo » dans l'onglet Accueil."/>
      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>
`;
