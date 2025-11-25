import { type Locale } from "@/lib/types"

interface ListBlock {
  title?: string
  items: string[]
}

interface Section {
  id: string
  heading: string
  paragraphs: string[]
  lists?: ListBlock[]
}

export interface UserServiceCopy {
  pageTitle: string
  summary: string
  seoDescription: string
  effectiveDateLabel: string
  effectiveDate: string
  disclaimer: string
  sections: Section[]
  contactHeading: string
  contactDescription: string
  contactEmailLabel: string
  contactEmail: string
}

const userServiceContent: Record<Locale, UserServiceCopy> = {
  en: {
    pageTitle: "User Service Agreement",
    summary:
      "This Agreement explains the rights, responsibilities, and limitations that apply when you use svgconvert.net's conversion tools and related content.",
    seoDescription:
      "User Service Agreement for svgconvert.net effective November 25, 2025, covering service terms, responsibilities, and legal notices.",
    effectiveDateLabel: "Effective Date",
    effectiveDate: "November 25, 2025",
    disclaimer:
      "If any translation differs from the English version of this Agreement, the English version controls. The English text is the master version and other languages are provided for reference only.",
    sections: [
      {
        id: "agreement-and-modifications",
        heading: "1. Agreement and Modifications",
        paragraphs: [
          "By using svgconvert.net (the \"Website\"), you confirm you have read, understood, and agree to this User Service Agreement (\"Agreement\"), which supersedes any prior understanding between you and us.",
          "We may modify this Agreement at our discretion. Updates will be posted on the Website, and your continued use after changes are posted constitutes acceptance. If you do not agree, please stop using the Services."
        ]
      },
      {
        id: "description-of-services",
        heading: "2. Description of Services",
        paragraphs: [
          "svgconvert.net provides online SVG and bitmap conversion, download links, limited storage, blog content, and related utilities (collectively, the \"Services\").",
          "We may change, suspend, or discontinue any feature—such as supported formats, storage durations, processing queues, or overall availability—without notice or liability."
        ]
      },
      {
        id: "user-responsibilities",
        heading: "3. User Responsibilities",
        paragraphs: [
          "You must use the Services lawfully and responsibly."
        ],
        lists: [
          {
            title: "You may not submit content that:",
            items: [
              "violates applicable laws, regulations, or public security requirements;",
              "is insulting, defamatory, obscene, violent, or incites unlawful conduct;",
              "infringes third-party intellectual property, privacy, reputation, or other rights."
            ]
          },
          {
            title: "You must not use the Services to:",
            items: [
              "interfere with or disrupt the Services or related networks;",
              "attempt unauthorized access to any system or data;",
              "upload malware, malicious scripts, or destructive code;",
              "overload the infrastructure through abusive automated activity."
            ]
          }
        ]
      },
      {
        id: "indemnification",
        heading: "4. Indemnification",
        paragraphs: [
          "You are solely responsible for the content you submit or publish and agree to indemnify and hold us harmless from any claims arising from your breach of this Agreement or applicable law."
        ]
      },
      {
        id: "privacy-and-data",
        heading: "5. Privacy and Data",
        paragraphs: [
          "We collect and use personal and non-personal data to operate and improve the Services.",
          "Please review our Privacy Policy to understand how we handle your information.",
          "We may log access records and use cookies or similar technologies for security, analytics, and product quality."
        ]
      },
      {
        id: "disclaimers",
        heading: "6. Disclaimers",
        paragraphs: [
          "The Services are provided on an \"as is\" and \"as available\" basis without warranties of merchantability, fitness for a particular purpose, or non-infringement.",
          "Any results or materials obtained through the Services are at your own discretion and risk.",
          "Links to third-party sites are provided for convenience; we are not responsible for their content, security, or practices."
        ]
      },
      {
        id: "limitation-of-liability",
        heading: "7. Limitation of Liability",
        paragraphs: [
          "To the fullest extent permitted by law, we are not liable for indirect, incidental, special, punitive, or consequential damages, including loss of profits, data, business interruption, or reputation.",
          "If liability is found, our total liability is limited to the lesser of USD 100 or the amounts you paid for the Services in the six months preceding the claim."
        ]
      },
      {
        id: "intellectual-property",
        heading: "8. Intellectual Property",
        paragraphs: [
          "All content, software, and materials on svgconvert.net are owned by us or our licensors and protected by intellectual property laws.",
          "We grant you a limited, non-exclusive, non-transferable license to access and use the Services under this Agreement. You may not copy, modify, sell, rent, distribute, reverse engineer, or decompile the Services or their content."
        ]
      },
      {
        id: "governing-law",
        heading: "9. Governing Law and Jurisdiction",
        paragraphs: [
          "This Agreement is governed by the laws of the People's Republic of China, without regard to conflict of law rules.",
          "Disputes will first be resolved through good-faith negotiation; if unresolved, they will be submitted to the competent courts in Hangzhou, China."
        ]
      },
      {
        id: "contact",
        heading: "10. Contact Information",
        paragraphs: [
          "If you have questions about this Agreement or the Services, contact us at shendongloving123@gmail.com."
        ]
      }
    ],
    contactHeading: "Contact",
    contactDescription: "Questions about this Agreement or how we operate the service? We are here to help.",
    contactEmailLabel: "Email",
    contactEmail: "shendongloving123@gmail.com"
  },
  ja: {
    pageTitle: "ユーザーサービス利用規約",
    summary:
      "本規約は、svgconvert.net が提供する変換ツールおよび関連コンテンツを利用する際の権利・責任・制限を定めるものです。",
    seoDescription:
      "svgconvert.net のユーザーサービス利用規約。2025年11月25日発効のサービス条件と法的通知です。",
    effectiveDateLabel: "発効日",
    effectiveDate: "2025年11月25日",
    disclaimer:
      "本規約の翻訳版に英語版と異なる点がある場合、英語版を優先します。英語版が原本であり、その他の言語は参考訳です。",
    sections: [
      {
        id: "agreement-and-modifications",
        heading: "1. 契約と変更",
        paragraphs: [
          "svgconvert.net（以下「本サイト」）を利用することで、本ユーザーサービス利用規約（以下「本規約」）を読み、理解し、同意したものとみなされ、過去の取り決めに優先して適用されます。",
          "当社は独自の裁量で本規約を変更できます。更新内容は本サイトに掲示され、変更後もサービスを利用することで同意したものとみなされます。異議がある場合は利用を停止してください。"
        ]
      },
      {
        id: "description-of-services",
        heading: "2. サービスの内容",
        paragraphs: [
          "本サイトは、SVG とビットマップのオンライン変換、ダウンロードリンク、一定期間の保存、ブログ記事、および関連ユーティリティ（総称して「サービス」）を提供します。",
          "サポート形式、保存期間、処理キュー、提供可否など、いかなる機能も予告なく変更・中断・終了する場合があります。これによる責任は負いません。"
        ]
      },
      {
        id: "user-responsibilities",
        heading: "3. ユーザーの責任",
        paragraphs: [
          "サービスは適法かつ責任を持って利用してください。"
        ],
        lists: [
          {
            title: "以下の内容を送信してはなりません。",
            items: [
              "適用される法律・規制、公序良俗に違反する内容",
              "侮辱、名誉毀損、わいせつ、暴力的な内容、または違法行為を扇動する内容",
              "第三者の知的財産権、プライバシー、名誉その他の権利を侵害する内容"
            ]
          },
          {
            title: "サービスを以下の目的で利用してはなりません。",
            items: [
              "サービスや関連ネットワークの運用を妨害すること",
              "システムやデータへの不正アクセスを試みること",
              "マルウェアや破壊的なコードをアップロードすること",
              "過剰な自動化によりインフラに過負荷を与えること"
            ]
          }
        ]
      },
      {
        id: "indemnification",
        heading: "4. 免責と補償",
        paragraphs: [
          "送信・公開する内容についてはユーザー自身が全責任を負い、本規約または適用法違反に起因する請求について当社を補償・免責することに同意するものとします。"
        ]
      },
      {
        id: "privacy-and-data",
        heading: "5. プライバシーとデータ",
        paragraphs: [
          "当社はサービスの運営および改善のため、個人情報および非個人情報を収集・利用します。",
          "情報の取扱いについてはプライバシーポリシーをご確認ください。",
          "セキュリティ、分析、品質向上のため、アクセス記録の保存や Cookie 等の技術を使用する場合があります。"
        ]
      },
      {
        id: "disclaimers",
        heading: "6. 免責事項",
        paragraphs: [
          "サービスは「現状有姿」かつ「提供可能な範囲」で提供され、商品性、特定目的への適合性、権利非侵害について保証しません。",
          "サービスから得られる結果や資料は自己責任で利用してください。",
          "第三者サイトへのリンクは便宜提供のみであり、その内容やセキュリティ、運用について当社は責任を負いません。"
        ]
      },
      {
        id: "limitation-of-liability",
        heading: "7. 責任の制限",
        paragraphs: [
          "適用法で認められる最大限の範囲で、当社は間接的、偶発的、特別、懲罰的、結果的損害（利益、データ、事業の中断、信用の損失等を含む）について責任を負いません。",
          "責任が認められる場合でも、当社の総責任額は、請求前6か月間に支払われた金額または100米ドルのいずれか低い方を上限とします。"
        ]
      },
      {
        id: "intellectual-property",
        heading: "8. 知的財産",
        paragraphs: [
          "本サイト上のコンテンツ、ソフトウェア、資料は当社またはライセンサーに帰属し、知的財産法によって保護されています。",
          "本規約に基づき、限定的かつ非独占的、譲渡不可の利用ライセンスを付与します。コンテンツやソフトウェアの複製、改変、販売、賃貸、配布、リバースエンジニアリング、逆コンパイル等は禁止します。"
        ]
      },
      {
        id: "governing-law",
        heading: "9. 準拠法と裁判管轄",
        paragraphs: [
          "本規約は抵触法を除き、中華人民共和国の法律に準拠します。",
          "紛争はまず誠実な協議で解決を試み、解決しない場合は中国・杭州市の管轄裁判所に提起されます。"
        ]
      },
      {
        id: "contact",
        heading: "10. 連絡先",
        paragraphs: [
          "本規約やサービスについてのご質問は shendongloving123@gmail.com までご連絡ください。"
        ]
      }
    ],
    contactHeading: "お問い合わせ",
    contactDescription: "本規約やサービスの運用に関するご相談を受け付けています。",
    contactEmailLabel: "メール",
    contactEmail: "shendongloving123@gmail.com"
  },
  zh: {
    pageTitle: "用户服务协议",
    summary:
      "本协议说明您在使用 svgconvert.net 的转换工具及相关内容时应遵守的权利、义务与限制。",
    seoDescription:
      "svgconvert.net 用户服务协议，自 2025 年 11 月 25 日起生效，涵盖服务条款、用户义务及法律声明。",
    effectiveDateLabel: "生效日期",
    effectiveDate: "2025年11月25日",
    disclaimer:
      "如各语言版本与英文版存在不一致，应以英文版为准。英文版为主版本，其余语言仅供参考。",
    sections: [
      {
        id: "agreement-and-modifications",
        heading: "1. 协议与修改",
        paragraphs: [
          "使用 svgconvert.net(\"本网站\")即表示您已阅读、理解并同意本用户服务协议(\"本协议\")，本协议优先于双方之前的任何约定。",
          "我们可能自行决定修改本协议。更新内容将发布在本网站，修改发布后继续使用服务即视为接受;如不同意，请停止使用。"
        ]
      },
      {
        id: "description-of-services",
        heading: "2. 服务说明",
        paragraphs: [
          "本网站提供 SVG 与位图的在线转换、下载链接、限期存储、博客内容及相关工具(统称\"服务\")。",
          "我们可能随时变更、暂停或终止任何功能，例如支持格式、存储期限、处理队列或整体可用性，恕不另行通知且不承担责任。"
        ]
      },
      {
        id: "user-responsibilities",
        heading: "3. 用户责任",
        paragraphs: [
          "您应合法、审慎地使用服务。"
        ],
        lists: [
          {
            title: "您不得提交以下内容：",
            items: [
              "违反适用法律、法规或公共安全要求的内容；",
              "侮辱、诽谤、淫秽、暴力或煽动违法行为的内容；",
              "侵犯第三方知识产权、隐私、名誉或其他合法权利的内容。"
            ]
          },
          {
            title: "您不得将服务用于：",
            items: [
              "干扰或破坏服务或相关网络；",
              "试图未经授权访问任何系统或数据；",
              "上传恶意软件、脚本或破坏性代码；",
              "通过滥用自动化行为使基础设施过载。"
            ]
          }
        ]
      },
      {
        id: "indemnification",
        heading: "4. 赔偿与免责",
        paragraphs: [
          "您对自己提交或发布的内容承担全部责任，并同意因违反本协议或适用法律产生的任何索赔而对我们进行赔偿并使我们免受损害。"
        ]
      },
      {
        id: "privacy-and-data",
        heading: "5. 隐私与数据",
        paragraphs: [
          "我们会收集和使用个人及非个人信息，以运营和改进服务。",
          "请查阅我们的《隐私政策》以了解信息处理方式。",
          "我们可能记录访问日志，并使用 Cookie 或类似技术用于安全、分析和质量提升。"
        ]
      },
      {
        id: "disclaimers",
        heading: "6. 免责声明",
        paragraphs: [
          "服务按\"现状\"和\"可用性\"提供，不提供适销性、特定用途适用性或不侵权的保证。",
          "您自行承担使用服务取得的结果或资料的风险。",
          "链接到第三方网站仅为方便之用，对于其内容、安全或运营我们不承担责任。"
        ]
      },
      {
        id: "limitation-of-liability",
        heading: "7. 责任限制",
        paragraphs: [
          "在法律允许的最大范围内，我们不对任何间接、附带、特殊、惩罚性或后果性损害负责，包括利润、数据、业务中断或商誉损失。",
          "如被认定需承担责任，我们的总责任以您在索赔前六个月内就服务支付的金额或100美元（以较低者为准）为上限。"
        ]
      },
      {
        id: "intellectual-property",
        heading: "8. 知识产权",
        paragraphs: [
          "本网站的内容、软件及资料归我们或许可方所有，受知识产权法律保护。",
          "在本协议下您获得有限的、非独占、不可转让的使用许可；不得复制、修改、出售、出租、分发、逆向工程或反编译服务或其内容。"
        ]
      },
      {
        id: "governing-law",
        heading: "9. 适用法律与管辖",
        paragraphs: [
          "本协议受中华人民共和国法律管辖，不适用冲突法规则。",
          "争议应首先通过诚信协商解决；未果的，提交至中国杭州的有管辖权法院。"
        ]
      },
      {
        id: "contact",
        heading: "10. 联系方式",
        paragraphs: [
          "如对本协议或服务有疑问，请通过 shendongloving123@gmail.com 与我们联系。"
        ]
      }
    ],
    contactHeading: "联系方式",
    contactDescription: "欢迎就本协议或服务运营与我们沟通。",
    contactEmailLabel: "邮箱",
    contactEmail: "shendongloving123@gmail.com"
  }
}

export function getUserServiceCopy(locale: Locale): UserServiceCopy {
  return userServiceContent[locale] ?? userServiceContent.en
}
