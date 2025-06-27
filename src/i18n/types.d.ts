import "i18next";

// 匯入翻譯資源類型
import en from "../../public/locales/common/en.json";

type CommonResources = typeof en;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: CommonResources;
    };
    returnNull: false;
    keySeparator: ".";
    nsSeparator: ":";
  }
}

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: CommonResources;
    };
  }
}
