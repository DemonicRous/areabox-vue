import { asahiTemplate, eternaTemplate, createInlineTemplate, createFolderGluingTemplate, createPrintingTemplate, createStitchingTemplate, fosberTemplate, gerunTemplate, kongsbergTemplate, wardTemplate, type EquipmentParameterGroup } from './equipment'
export interface Passport { id: string; name: string; groups: EquipmentParameterGroup[] }
export const machines: Record<string, Passport[]> = {
  folderGluer: [
    { id: 'signature-elite-135', name: 'SIGNATURE ELITE-135', groups: createFolderGluingTemplate('SIGNATURE ELITE-135') },
    { id: 'rolam-1100', name: 'ROLAM-1100', groups: createFolderGluingTemplate('ROLAM-1100') },
    { id: 'rito-jh-1700', name: 'RITO JH-1700', groups: createFolderGluingTemplate('RITO JH-1700') },
  ],
  laminator: [{ id: 'gerun-1320', name: 'Gerun 1320', groups: gerunTemplate }],
  stitching: [
    { id: 'godswill-gts-3000', name: 'Godswill GTS-3000', groups: createStitchingTemplate('Godswill', 'GTS-3000') },
    { id: 'gofrotime-sdj-2000b', name: 'GofroTime SDJ-2000B', groups: createStitchingTemplate('GofroTime', 'SDJ-2000B') },
  ],
  corrugator: [{ id: 'fosber', name: 'Fosber', groups: fosberTemplate }],
  printing: [
    { id: 'pinlong', name: 'Pinlong', groups: createPrintingTemplate('Pinlong') },
    { id: 'digital', name: 'Цифровая печать (Hanway)', groups: createPrintingTemplate('Цифровая печать') },
  ],
  inline: [
    { id: 'tcy-5pa', name: 'TCY 5PA', groups: createInlineTemplate('5PA') },
    { id: 'tcy-9pa-2', name: 'TCY 9PA-2', groups: createInlineTemplate('9PA-2') },
  ],
  plotter: [{ id: 'kongsberg', name: 'Kongsberg', groups: kongsbergTemplate }],
  rotary: [{ id: 'ward', name: 'WARD', groups: wardTemplate }],
  flatbed: [{ id: 'asahi', name: 'Asahi', groups: asahiTemplate }, { id: 'eterna', name: 'ETERNA', groups: eternaTemplate }],
}
