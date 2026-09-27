/*
 * NANC Bilingual Community Needs Assessment — questionnaire definition.
 * Source: NANC_Bilingual_Needs_Assessment_Google_Form_v7.pdf (English pp. 1-17, Nepali pp. 18-37).
 * Nepali text was transcribed from the rendered PDF pages because the PDF's text layer is
 * garbled (legacy font encoding). A native Nepali speaker should proofread before launch.
 * Deviations from v7 are listed in docs/questionnaire-notes.md.
 *
 * Question types:
 *   text    free text                       answers[id] = "..."
 *   single  one choice                      answers[id] = "value"
 *   multi   select all that apply           answers[id] = ["a","b"]
 *   matrix  one choice per row              answers[id] = { row: "col" }
 *   counts  a number per row (household)    answers[id] = { row: 2 }
 * Option flags: other (shows a text box), exclusive (clears the other choices).
 */
(function () {
  function o(v, en, ne, x) { return Object.assign({ v: v, en: en, ne: ne }, x || {}); }
  var OTHER = function (en, ne) { return o('other', en || 'Other', ne || 'अन्य', { other: true }); };
  var DK = o('dont_know', "Don't know", 'थाहा छैन', { exclusive: true });
  var REFUSE = o('prefer_not', 'Prefer not to answer', 'जवाफ दिन अस्वीकार गर्छु', { exclusive: true });
  var NOWANT = o('prefer_not', 'Prefer not to answer', 'उत्तर दिन चाहन्नँ', { exclusive: true });
  var NOWANT2 = o('prefer_not', 'Prefer not to answer', 'जवाफ दिन चाहन्नँ', { exclusive: true });
  var NOTSURE = o('not_sure', 'Not sure', 'निश्चित छैन');
  var ALL = { en: 'Select all that apply.', ne: 'लागू हुने सबै छान्नुहोस्।' };

  var CONFIDENCE = [
    o('very', 'Very confident', 'धेरै आत्मविश्वासी'),
    o('somewhat', 'Somewhat confident', 'केही आत्मविश्वासी'),
    o('slightly', 'Slightly confident', 'थोरै आत्मविश्वासी'),
    o('not', 'Not confident', 'आत्मविश्वास छैन'),
    o('need_help', 'I usually need help', 'मलाई प्रायः सहयोग चाहिन्छ')
  ];

  var SERVICES = [
    o('health_care', 'Health care', 'स्वास्थ्य सेवा'),
    o('health_education', 'Health education', 'स्वास्थ्य शिक्षा'),
    o('health_insurance', 'Health insurance', 'स्वास्थ्य बीमा'),
    o('maternal', 'Pregnancy, maternal, and infant health services', 'गर्भावस्था, मातृ तथा शिशु स्वास्थ्य सेवा'),
    o('mental_health', 'Mental health and counseling', 'मानसिक स्वास्थ्य र परामर्श'),
    o('county_services', 'County benefits and social services', 'काउन्टी सुविधा र सामाजिक सेवा'),
    o('financial', 'Financial assistance or benefits information', 'आर्थिक सहायता वा लाभसम्बन्धी जानकारी'),
    o('housing', 'Housing and tenant rights', 'आवास र भाडावालाको अधिकार'),
    o('employment', 'Employment and workplace rights', 'रोजगार र कार्यस्थलको अधिकार'),
    o('transportation', 'Transportation assistance', 'यातायात/सवारी साधन सहयोग'),
    o('dmv', "DMV and driver's test preparation", 'DMV र सवारीचालक परीक्षा तयारी'),
    o('immigration', 'Immigration and citizenship test preparation', 'आप्रवासन र नागरिकता परीक्षा तयारी'),
    o('emergency', 'Emergency and disaster information', 'आपत्कालीन र विपद् सूचना'),
    o('senior', 'Senior services', 'ज्येष्ठ नागरिक सेवा'),
    o('disability', 'Disability services', 'अपाङ्गता सेवा'),
    o('school_childcare', 'School and child care', 'विद्यालय र बाल हेरचाह'),
    o('legal', 'Legal and court information', 'कानुनी र अदालती जानकारी'),
    o('tax', 'Tax information', 'कर/ट्याक्ससम्बन्धी सूचना'),
    o('food_nutrition', 'Food and nutrition assistance', 'खाद्य तथा पोषण सहायता'),
    o('youth', 'Child and youth services', 'बालबालिका र युवासम्बन्धी सेवा'),
    o('food_programs', 'Food-assistance program information', 'खाद्य सहायता कार्यक्रमसम्बन्धी जानकारी'),
    o('voter', 'Voter-registration or election information', 'मतदाता दर्ता वा निर्वाचन जानकारी')
  ];

  window.SURVEY = {
    id: 'nanc-needs-assessment',
    version: 'v7',

    consent: {
      title: { en: 'Survey Information and Consent', ne: 'सर्वेक्षणबारे जानकारी र सहमति' },
      paragraphs: [
        {
          en: 'The Nepali Association of Northern California (NANC) is conducting this survey to understand the needs, challenges, strengths, and priorities of Nepali community members living in West Contra Costa County. The results will guide the translation of commonly requested information into Nepali, as well as the development of English classes, service navigation, education, outreach, future programs, and partnerships.',
          ne: 'नेपाली एसोसिएसन अफ नर्दर्न क्यालिफोर्निया (NANC) ले पश्चिम कन्ट्रा कोस्टा काउन्टीमा बसोबास गर्ने नेपाली समुदायका आवश्यकता, चुनौती, सबल पक्ष र प्राथमिकताहरू बुझ्न यो सर्वेक्षण सञ्चालन गरिरहेको छ। यस सर्वेक्षणबाट प्राप्त नतिजाहरूले अधिकांश मानिसहरूले खोजिरहेका जानकारीलाई नेपालीमा अनुवाद गर्न मार्गदर्शन गर्नेछन्, साथै अंग्रेजी कक्षा, सेवामा मार्गदर्शन, शिक्षा, जनसम्पर्क, र भविष्यका कार्यक्रम तथा साझेदारीहरूको निर्माण गर्न मार्गदर्शन गर्नेछ।'
        },
        {
          en: 'This survey takes about 15 minutes to complete. Participation is completely voluntary. Your name will not be collected. You may skip any question that is not marked required or stop the survey at any time. Survey results will be presented only in summary form.',
          ne: 'यो सर्वेक्षण पूरा गर्न करिब १५ मिनेट लाग्नेछ। यसमा सहभागिता पूर्ण रूपमा स्वैच्छिक छ। तपाईंको नाम सङ्कलन गरिने छैन। अनिवार्य भनी उल्लेख नगरिएका कुनै पनि प्रश्न छोड्न वा जुनसुकै समयमा सर्वेक्षण रोक्न सक्नुहुन्छ। सर्वेक्षणका नतिजाहरू समग्र सारांशका रूपमा मात्र प्रस्तुत गरिनेछन्।'
        },
        {
          en: 'The purpose of this survey is to assess and identify the needs of the Nepali community and provide a foundation for community programs and planning. This survey does not provide medical, legal, or emergency assistance.',
          ne: 'यो सर्वेक्षणको उद्देश्य नेपाली समुदायका आवश्यकताहरूको मूल्याङ्कन तथा पहिचान गर्नु र सामुदायिक कार्यक्रम तथा योजना निर्माणका लागि आधार तयार गर्नु हो। यसमार्फत चिकित्सा, कानुनी वा आपत्कालीन सहायता प्रदान गरिँदैन।'
        }
      ],
      questions: [
        { id: 'C1', type: 'text', contact: true, en: 'First Name', ne: 'पहिलो नाम' },
        { id: 'C2', type: 'text', contact: true, en: 'Last Name', ne: 'थर' },
        {
          id: 'C3', type: 'single', required: true,
          en: 'Are you 18 years of age or older, and do you voluntarily agree to participate in this survey?',
          ne: 'के तपाईं १८ वर्ष वा सोभन्दा बढी उमेरको हुनुहुन्छ र यस सर्वेक्षणमा स्वेच्छाले सहभागी हुन सहमत हुनुहुन्छ?',
          options: [
            o('yes', 'Yes — Continue', 'हो — अगाडि बढ्नुहोस्'),
            o('no', 'No — Exit', 'होइन — बाहिरिनुहोस्')
          ]
        }
      ]
    },

    sections: [
      /* ---------------------------------------------------------------- 1 */
      {
        id: 'about',
        title: { en: 'About You', ne: 'तपाईंको बारेमा' },
        intro: {
          en: 'These questions help us understand who is participating in the survey.',
          ne: 'यी प्रश्नहरूले सर्वेक्षणमा कस्ता व्यक्तिहरू सहभागी भइरहेका छन् भन्ने बुझ्न मद्दत गर्छन्।'
        },
        questions: [
          {
            id: 'D1', type: 'single',
            en: 'In which county do you currently live?', ne: 'तपाईं हाल कुन काउन्टीमा बस्नुहुन्छ?',
            options: [
              o('contra_costa', 'Contra Costa', 'कन्ट्रा कोस्टा काउन्टी'),
              o('alameda', 'Alameda', 'अलामेडा'),
              o('san_francisco', 'San Francisco', 'सान फ्रान्सिस्को'),
              o('solano', 'Solano', 'सोलानो'),
              o('marin', 'Marin', 'मरिन'),
              o('san_mateo', 'San Mateo', 'सान माटेओ'),
              OTHER('Others'),
              DK
            ]
          },
          {
            id: 'D2', type: 'single',
            en: 'In which city do you currently live?', ne: 'तपाईं हाल कुन सहरमा बस्नुहुन्छ?',
            options: [
              o('richmond', 'Richmond', 'रिचमन्ड'),
              o('san_pablo', 'San Pablo', 'सान पाब्लो'),
              o('el_sobrante', 'El Sobrante', 'एल सोब्रान्टे'),
              o('north_richmond', 'North Richmond', 'नर्थ रिचमन्ड'),
              o('el_cerrito', 'El Cerrito', 'एल सेरिटो'),
              o('pinole', 'Pinole', 'पिनोल'),
              o('hercules', 'Hercules', 'हर्क्युलिस'),
              o('rodeo_crockett', 'Rodeo or Crockett', 'रोडियो वा क्रोकेट'),
              o('other_cc', 'Another community in Contra Costa County', 'कन्ट्रा कोस्टा काउन्टीको अर्को समुदाय'),
              o('outside_cc', 'Outside Contra Costa County', 'कन्ट्रा कोस्टा काउन्टी बाहिर'),
              OTHER(),
              DK,
              REFUSE
            ]
          },
          {
            id: 'D3', type: 'single',
            en: 'What is your age group?', ne: 'तपाईंको उमेर समूह कुन हो?',
            options: [
              o('18_24', '18–24', '१८–२४'),
              o('25_34', '25–34', '२५–३४'),
              o('35_44', '35–44', '३५–४४'),
              o('45_54', '45–54', '४५–५४'),
              o('55_64', '55–64', '५५–६४'),
              o('65_74', '65–74', '६५–७४'),
              o('75_plus', '75 or older', '७५ वा सोभन्दा बढी'),
              NOWANT
            ]
          },
          {
            id: 'D4', type: 'single',
            en: 'What is your gender identity?', ne: 'तपाईंको आफ्नो लैङ्गिक पहिचान के हो?',
            options: [
              o('woman', 'Woman', 'महिला'),
              o('man', 'Man', 'पुरुष'),
              o('nonbinary', 'Nonbinary', 'गैर-द्विआधारी'),
              o('another', 'Another gender identity', 'अर्को लैङ्गिक पहिचान'),
              DK,
              REFUSE
            ]
          },
          {
            id: 'D5', type: 'single',
            en: 'How long have you lived in the United States?', ne: 'तपाईं अमेरिकामा बसेको कति समय भयो?',
            options: [
              o('lt_1', 'Less than 1 year', '१ वर्षभन्दा कम'),
              o('1_5', '1–5 years', '१–५ वर्ष'),
              o('6_10', '6–10 years', '६–१० वर्ष'),
              o('11_20', '11–20 years', '११–२० वर्ष'),
              o('gt_20', 'More than 20 years', '२० वर्षभन्दा बढी'),
              o('born_us', 'I was born in the United States', 'म अमेरिकामै जन्मिएको हुँ'),
              DK,
              REFUSE
            ]
          },
          {
            id: 'D6', type: 'single',
            en: 'How many people in total currently live in your household?',
            ne: 'तपाईं हाल बसोबास गरिरहनुभएको घरमा जम्मा कति जना सदस्य बस्नुहुन्छ?',
            options: [
              o('1', '1 person', '१ जना'),
              o('2', '2 people', '२ जना'),
              o('3', '3 people', '३ जना'),
              o('4', '4 people', '४ जना'),
              o('5', '5 people', '५ जना'),
              o('6', '6 people', '६ जना'),
              o('7_plus', 'More than 6 people', '६ जनाभन्दा बढी')
            ]
          },
          {
            id: 'D7', type: 'counts',
            en: 'How many people in each of the following age groups live in your household?',
            ne: 'तपाईंको घरमा निम्न उमेर समूहका कति जना सदस्य बस्नुहुन्छ?',
            rows: [
              o('0_5', '0–5 years', '०–५ वर्ष'),
              o('6_10', '6–10 years', '६–१० वर्ष'),
              o('11_15', '11–15 years', '११–१५ वर्ष'),
              o('16_25', '16–25 years', '१६–२५ वर्ष'),
              o('26_35', '26–35 years', '२६–३५ वर्ष'),
              o('36_50', '36–50 years', '३६–५० वर्ष'),
              o('51_65', '51–65 years', '५१–६५ वर्ष'),
              o('66_75', '66–75 years', '६६–७५ वर्ष'),
              o('75_plus', 'Over 75 years', '७५ वर्षभन्दा माथि')
            ]
          },
          {
            id: 'D8', type: 'single',
            en: 'Does anyone in your household have a disability or need long-term care?',
            ne: 'के तपाईंको घरमा अपाङ्गता भएको वा दीर्घकालीन हेरचाह आवश्यक पर्ने व्यक्ति बस्नुहुन्छ?',
            options: [o('yes', 'Yes', 'बस्नुहुन्छ'), o('no', 'No', 'बस्नुहुन्न'), DK, REFUSE]
          },
          {
            id: 'D9', type: 'multi', hint: ALL,
            en: 'What is your current work/employment status?',
            ne: 'तपाईंको हालको काम/रोजगारको अवस्था के छ?',
            options: [
              o('full_time', 'Employed full-time', 'पूर्णकालीन रोजगारी'),
              o('part_time', 'Employed part-time', 'अंशकालीन रोजगारी'),
              o('self_employed', 'Self-employed', 'स्वरोजगार'),
              o('student', 'Student', 'विद्यार्थी'),
              o('unemployed_looking', 'Unemployed and looking for work', 'बेरोजगार र कामको खोजीमा'),
              o('not_looking', 'Not currently looking for work', 'हाल कामको खोजीमा नरहेको'),
              o('retired', 'Retired', 'सेवानिवृत्त'),
              o('unable', 'Unable to work', 'काम गर्न असमर्थ'),
              o('caregiver', 'Unpaid caregiver', 'बिनातलब हेरचाहकर्ता'),
              OTHER(),
              DK,
              REFUSE
            ]
          },
          {
            id: 'D10', type: 'single',
            en: 'During the past 12 months, how difficult was it for your household to pay regular expenses?',
            ne: 'विगत १२ महिनामा तपाईंको परिवारलाई नियमित खर्च तिर्न कतिको कठिन भयो?',
            options: [
              o('not_at_all', 'Not at all difficult', 'बिल्कुल कठिन भएन'),
              o('slightly', 'Slightly difficult', 'थोरै कठिन'),
              o('somewhat', 'Somewhat difficult', 'केही कठिन'),
              o('very', 'Very difficult', 'धेरै कठिन'),
              o('extremely', 'Extremely difficult', 'अत्यन्त कठिन'),
              DK,
              REFUSE
            ]
          }
        ]
      },

      /* ---------------------------------------------------------------- 2 */
      {
        id: 'language',
        title: { en: 'Language and Information Access', ne: 'भाषा र सूचना पहुँच' },
        intro: {
          en: 'The following questions ask where language assistance or translated information is needed. Please take your time when answering.',
          ne: 'तलका प्रश्नहरू कहाँ भाषा सहायता वा अनुवादित सूचना आवश्यक छ भन्ने बारेमा हुन्, कृपया समय लिएर उत्तर दिनुहोस्।'
        },
        questions: [
          {
            id: 'L1', type: 'multi', hint: ALL,
            en: 'Which languages are regularly spoken in your household?',
            ne: 'तपाईंको घरमा नियमित रूपमा कुन-कुन भाषा बोलिन्छ?',
            options: [
              o('nepali', 'Nepali', 'नेपाली'),
              o('english', 'English', 'अंग्रेजी'),
              o('hindi', 'Hindi', 'हिन्दी'),
              o('tibetan', 'Tibetan', 'तिब्बती'),
              o('newari', 'Newari/Nepal Bhasa', 'नेवारी/नेपाल भाषा'),
              o('maithili', 'Maithili', 'मैथिली'),
              o('bhojpuri', 'Bhojpuri', 'भोजपुरी'),
              OTHER()
            ]
          },
          {
            id: 'L2', type: 'single',
            en: 'How well do you speak English?', ne: 'तपाईं अंग्रेजी कतिको राम्रो बोल्नुहुन्छ?',
            options: [
              o('very_well', 'Very well', 'धेरै राम्रो'),
              o('well', 'Well', 'राम्रो'),
              o('not_well', 'Not very well', 'धेरै राम्रो होइन'),
              o('not_at_all', 'Not at all', 'बोल्न सक्दिनँ')
            ]
          },
          {
            id: 'L3', type: 'single',
            en: 'How confident are you in reading and filling out forms written in English or reading information on English-language websites?',
            ne: 'अंग्रेजीमा लेखिएका फाराम पढ्न र भर्न वा अंग्रेजीमा लेखिएका वेबसाइटमा जानकारी पढ्न तपाईं कतिको आत्मविश्वासी हुनुहुन्छ?',
            options: CONFIDENCE
          },
          {
            id: 'L4', type: 'single',
            en: 'How confident are you completing online forms, making appointments, or using a patient portal?',
            ne: 'अनलाइन फाराम भर्न, अपोइन्टमेन्ट लिन वा बिरामी पोर्टल प्रयोग गर्न तपाईं कतिको आत्मविश्वासी हुनुहुन्छ?',
            options: CONFIDENCE.concat([
              o('no_internet', 'I do not have reliable internet or a suitable device', 'मसँग भरपर्दो इन्टरनेट वा उपयुक्त उपकरण छैन')
            ])
          },
          {
            id: 'L5', type: 'multi', hint: ALL,
            en: 'During the past 12 months, where did English-language difficulties make it hard for you to obtain information or services?',
            ne: 'विगत १२ महिनामा अंग्रेजी भाषा समस्याका कारण तपाईंलाई कहाँ सूचना वा सेवा प्राप्त गर्न कठिनाइ भयो?',
            options: [
              o('doctor', 'Doctor or clinic', 'डाक्टर वा क्लिनिक'),
              o('hospital', 'Hospital', 'अस्पताल'),
              o('pharmacy', 'Pharmacy', 'औषधि पसल'),
              o('health_insurance', 'Health insurance', 'स्वास्थ्य बीमा'),
              o('county', 'County services', 'काउन्टी सेवा'),
              o('social', 'Social services', 'सामाजिक सेवा'),
              o('housing', 'Housing or rental services', 'घर वा भाडा सम्बन्धी सेवा'),
              o('school', 'School or childcare', 'विद्यालय वा बाल हेरचाह'),
              o('work', 'Work or employment services', 'काम वा रोजगार सेवा'),
              o('dmv', "DMV or driver's license test", 'DMV वा ड्राइभर लाइसेन्स परीक्षा'),
              o('immigration', 'Immigration or citizenship services', 'आप्रवासन वा नागरिकता सेवा'),
              o('legal', 'Court, police, or legal services', 'अदालत, प्रहरी वा कानुनी सेवा'),
              o('emergency', 'Emergency alerts or disaster information', 'आपत्कालीन सूचना वा विपद् सम्बन्धी जानकारी'),
              o('online', 'Online forms or websites', 'अनलाइन फाराम वा वेबसाइट'),
              o('none', 'I did not experience language difficulties', 'मलाई भाषा समस्या भएन', { exclusive: true }),
              OTHER('Other place', 'अन्य स्थान')
            ]
          },
          {
            id: 'L6', type: 'single',
            en: 'When you needed an interpreter, how often was a qualified interpreter available?',
            ne: 'तपाईंलाई दोभाषे आवश्यक पर्दा योग्य दोभाषे कति पटक उपलब्ध थिए?',
            options: [
              o('always', 'Always', 'सधैँ'),
              o('often', 'Often', 'प्रायः'),
              o('sometimes', 'Sometimes', 'कहिलेकाहीँ'),
              o('rarely', 'Rarely', 'विरलै'),
              o('never', 'Never available', 'कहिल्यै उपलब्ध भएन'),
              o('not_needed', 'I did not need an interpreter', 'मलाई दोभाषे आवश्यक परेन')
            ]
          },
          {
            id: 'L7', type: 'matrix',
            en: 'During the past 12 months, how often did you rely on the following people for English translation or interpretation?',
            ne: 'विगत १२ महिनामा अंग्रेजी अनुवाद वा दोभाषेका लागि तपाईंले निम्न व्यक्तिहरूमा कति पटक भर पर्नुपर्‍यो?',
            rows: [
              o('adult_family', 'Adult family member', 'वयस्क परिवार सदस्य'),
              o('friend', 'Friend', 'साथी'),
              o('child', 'Child under age 18', '१८ वर्षमुनिको बालबालिका'),
              OTHER()
            ],
            cols: [
              o('never', 'Never', 'कहिल्यै होइन'),
              o('once', 'Once', 'एक पटक'),
              o('sometimes', 'Sometimes', 'कहिलेकाहीँ'),
              o('often', 'Often', 'प्रायः')
            ]
          },
          {
            id: 'L8', type: 'multi', hint: ALL,
            en: 'If important community information were available, how would you prefer to receive it?',
            ne: 'तपाईंलाई यदि महत्त्वपूर्ण सामुदायिक जानकारी उपलब्ध गराइयो भने, ती जानकारीहरू कसरी प्राप्त गर्न चाहनुहुन्छ?',
            options: [
              o('print', 'Printed materials in Nepali', 'नेपालीमा छापिएका सामग्री'),
              o('web', 'Nepali-language web pages', 'नेपाली वेबसाइट पृष्ठ'),
              o('video', 'Short videos in Nepali', 'नेपाली छोटा भिडियो'),
              o('audio', 'Audio recordings in Nepali', 'नेपाली अडियो रेकर्डिङ'),
              o('whatsapp', 'WhatsApp messages', 'WhatsApp सन्देश'),
              o('social', 'Facebook or other social media', 'Facebook / अन्य सामाजिक सञ्जाल'),
              o('email', 'Email', 'इमेल'),
              o('phone', 'Telephone assistance', 'टेलिफोन सहायता सेवा'),
              o('workshop', 'In-person workshops', 'प्रत्यक्ष कार्यशाला'),
              o('leader', 'Information through a trusted community leader', 'विश्वासिलो सामुदायिक अगुवामार्फत जानकारी')
            ]
          },
          {
            id: 'L9', type: 'multi', max: 15,
            en: 'In your opinion, which information should be translated into Nepali first?',
            ne: 'तपाईंको विचारमा कुन जानकारी सबैभन्दा पहिले नेपालीमा अनुवाद हुनुपर्छ?',
            options: [
              o('health_care', 'Health care services', 'स्वास्थ्य सेवा'),
              o('health_education', 'Health education', 'स्वास्थ्य शिक्षा'),
              o('health_insurance', 'Health insurance', 'स्वास्थ्य बीमा'),
              o('mental_health', 'Mental health and counseling', 'मानसिक स्वास्थ्य र परामर्श'),
              o('maternal', 'Pregnancy, maternal, and child health services', 'गर्भावस्था, मातृ तथा शिशु स्वास्थ्य सेवा'),
              o('county_services', 'County services and social services', 'काउन्टी सुविधा र सामाजिक सेवा'),
              o('housing', "Housing and tenants' rights", 'आवास र भाडावालको अधिकार'),
              o('employment', 'Employment and workplace rights', 'रोजगार र कार्यस्थलको अधिकार'),
              o('transportation', 'Transportation/public transit assistance', 'यातायात/सवारी साधन सहयोग'),
              o('dmv', "DMV information and driver's license test preparation", 'DMV र सवारीचालक परीक्षा तयारी'),
              o('immigration', 'Immigration and citizenship', 'आप्रवासन र नागरिकता'),
              o('emergency', 'Emergency and disaster preparedness information', 'आपत्कालीन र विपद् सूचना'),
              o('older_adults', 'Services for older adults and people with disabilities', 'ज्येष्ठ नागरिक र अपाङ्गता सेवा'),
              o('school_childcare', 'Schools and child care', 'विद्यालय र बाल हेरचाह'),
              o('legal', 'Legal and court information', 'कानुनी र अदालती जानकारी'),
              o('disability', 'Disability services', 'अपाङ्गता सेवा'),
              o('tax', 'Tax-related information', 'कर/ट्याक्स सम्बन्धी सूचना'),
              o('food_nutrition', 'Food and nutrition assistance', 'खाद्य तथा पोषण सहायता'),
              o('youth', 'Services for children and youth', 'बालबालिका र युवासम्बन्धी सेवा'),
              o('food_programs', 'Information about food assistance programs', 'खाद्य सहायता कार्यक्रमसम्बन्धी जानकारी'),
              OTHER()
            ]
          }
        ]
      },

      /* ---------------------------------------------------------------- 3 */
      {
        id: 'services',
        title: { en: 'Services, Navigation, and Civic Engagement', ne: 'सेवा, मार्गदर्शन र नागरिक सहभागिता' },
        questions: [
          {
            id: 'N1', type: 'matrix',
            en: 'During the past 12 months, when you needed each service below, how much of the help you needed did you receive?',
            ne: 'विगत १२ महिनामा तलका प्रत्येक सेवा आवश्यक पर्दा, तपाईंले आवश्यक सहयोग कति पाउनुभयो?',
            rows: SERVICES,
            cols: [
              o('not_needed', 'Did not need', 'आवश्यक परेन'),
              o('all_help', 'Received all needed help', 'आवश्यक सबै सहयोग पाएँ'),
              o('some_help', 'Received some help', 'केही सहयोग पाएँ'),
              o('no_help', 'Received no help', 'सहयोग पाएनँ'),
              o('didnt_know', 'Did not know where to start', 'कहाँबाट सुरु गर्ने थाहा भएन')
            ]
          },
          {
            id: 'N2', type: 'multi', hint: ALL,
            en: 'What made it difficult to obtain services?',
            ne: 'सेवा प्राप्त गर्न कुन कुराले कठिन बनायो?',
            options: [
              o('didnt_know', 'Did not know what services were available', 'कस्ता सेवा उपलब्ध छन् भन्ने थाहा थिएन'),
              o('english_only', 'Information or forms were available only in English', 'जानकारी वा फाराम अंग्रेजीमा मात्र थियो'),
              o('hard_forms', 'Forms or eligibility rules were difficult to understand', 'फाराम वा योग्यता नियम बुझ्न कठिन थियो'),
              o('no_interpreter', 'An interpreter was not available', 'दोभाषे उपलब्ध थिएन'),
              o('cost', 'Cost or lack of insurance', 'खर्च वा बीमा नभएको'),
              o('wait', 'Long wait or no available appointment', 'लामो प्रतीक्षा वा अपोइन्टमेन्ट नपाएको'),
              o('transport', 'Transportation problems', 'यातायात समस्या'),
              o('hours', 'Office hours conflicted with work or caregiving responsibilities', 'कार्यालय समय काम वा हेरचाहको समयसँग जुधेको'),
              o('technology', 'Difficulty using a computer, phone, or website', 'कम्प्युटर, फोन वा वेबसाइट चलाउन कठिन भएको'),
              o('privacy', 'Concern about privacy or immigration consequences', 'गोपनीयता वा आप्रवासनसम्बन्धी असरको चिन्ता'),
              o('unfair', 'I was treated unfairly or disrespectfully', 'मसँग अन्यायपूर्ण वा अपमानजनक व्यवहार भएको'),
              o('none', 'I did not experience any difficulty', 'मैले कुनै कठिनाइ अनुभव गरिनँ', { exclusive: true })
            ]
          },
          {
            id: 'N3', type: 'multi', hint: ALL,
            en: 'What assistance would help you use services successfully?',
            ne: 'तपाईंको विचारमा सेवा सफलतापूर्वक प्रयोग गर्न कस्तो सहायता उपयोगी हुन्छ?',
            options: [
              o('navigator', 'Nepali-speaking community service navigator', 'नेपाली बोल्ने समुदाय सेवा मार्गदर्शक'),
              o('forms_help', 'Help completing forms', 'फाराम भर्न सहयोग'),
              o('interpreter', 'Interpreter at appointments', 'अपोइन्टमेन्टमा दोभाषे'),
              o('accompany', 'Someone to accompany you to appointments', 'अपोइन्टमेन्टमा सँगै जाने व्यक्ति'),
              o('phone_whatsapp', 'Assistance by phone or WhatsApp', 'फोन वा WhatsApp मार्फत सहायता'),
              o('videos', 'Step-by-step videos', 'चरणबद्ध भिडियो'),
              o('workshops', 'Group workshops', 'समूह कार्यशाला'),
              o('referrals', 'Service referrals with follow-up', 'पछिसम्म सम्पर्क राखिने सेवा रेफरल'),
              o('evening_weekend', 'Evening or weekend services', 'साँझ वा सप्ताहन्तमा सेवा')
            ]
          },
          {
            id: 'N4', type: 'single',
            en: 'During the past year, have you felt that you were treated unfairly because of your language, accent, race/ethnicity, immigrant background, or religion?',
            ne: 'विगत एक वर्षमा, भाषा, उच्चारण, जाति/जातीयता, आप्रवासी पृष्ठभूमि वा धर्मका कारण तपाईंलाई अनुचित व्यवहार भएको महसुस भएको छ?',
            options: [o('yes', 'Yes', 'छ'), o('no', 'No', 'छैन'), DK, NOWANT2]
          },
          {
            id: 'N5', type: 'multi', hint: ALL,
            en: 'What would make it easier for you to participate in community programs, training, or services?',
            ne: 'तपाईंलाई समुदायका कार्यक्रम, तालिम वा सेवामा सहभागी हुन के कुराले सजिलो बनाउनेछ?',
            options: [
              o('nepali', 'Programs in Nepali', 'नेपाली भाषामा कार्यक्रम'),
              o('evening_weekend', 'Evening or weekend programs', 'साँझ वा सप्ताहन्तमा कार्यक्रम'),
              o('childcare', 'Child care', 'बालबालिका हेरचाहको सुविधा'),
              o('transport', 'Transportation assistance', 'यातायात सहयोग'),
              o('online', 'Online/virtual options', 'अनलाइन / भर्चुअल विकल्प'),
              o('tech_help', 'Help using technology', 'प्रविधि प्रयोग गर्न सहयोग'),
              o('near_home', 'Programs at a location close to home', 'घर नजिकको स्थानमा कार्यक्रम'),
              o('whatsapp', 'Information through WhatsApp or social media', 'WhatsApp वा सामाजिक सञ्जालमार्फत जानकारी'),
              OTHER('Other (please specify)', 'अन्य (कृपया उल्लेख गर्नुहोस्)')
            ]
          },
          {
            id: 'CIV1', type: 'matrix',
            en: 'How confident are you doing the following?',
            ne: 'निम्न काम गर्न तपाईं कतिको आत्मविश्वासी हुनुहुन्छ?',
            rows: [
              o('dmv', "Use DMV services or prepare for the driver's test", 'DMV सेवा प्रयोग गर्न वा सवारीचालक परीक्षाको तयारी गर्न'),
              o('immigration', 'Find reliable immigration or citizenship information', 'भरपर्दो आप्रवासन वा नागरिकतासम्बन्धी जानकारी खोज्न'),
              o('voter', 'Find voter-registration or election information, if eligible', 'योग्य भएमा मतदाता दर्ता वा निर्वाचनसम्बन्धी जानकारी खोज्न'),
              o('county', 'Contact a county department', 'काउन्टी विभागलाई सम्पर्क गर्न'),
              o('health', 'Obtain care from a health care provider or hospital', 'स्वास्थ्य सेवा वा अस्पतालमा सेवा लिन'),
              o('public_meeting', 'Participate in a public meeting or community decision', 'सार्वजनिक बैठक वा सामुदायिक निर्णयमा सहभागी हुन')
            ],
            cols: [
              o('very', 'Very confident', 'धेरै आत्मविश्वासी'),
              o('somewhat', 'Somewhat confident', 'केही आत्मविश्वासी'),
              o('slightly', 'Slightly confident', 'थोरै आत्मविश्वासी'),
              o('not', 'Not confident', 'आत्मविश्वास छैन'),
              o('na', 'N/A', 'लागू हुँदैन')
            ]
          },
          {
            id: 'CIV2', type: 'multi', hint: ALL,
            en: 'Which of the following workshops would be useful to you or your family?',
            ne: 'तपाईं वा तपाईंको परिवारका लागि निम्न मध्ये कुन कार्यशाला उपयोगी हुन्छ?',
            options: [
              o('kyr', 'Know Your Rights workshop', 'आफ्नो अधिकार जान्ने सम्बन्धी कार्यशाला'),
              o('citizenship', 'Citizenship test preparation', 'नागरिकता परीक्षा तयारी'),
              o('dmv', "DMV/driver's test preparation", 'DMV/सवारीचालक परीक्षा तयारी'),
              o('county', 'How to use county services', 'काउन्टी सेवा कसरी प्रयोग गर्ने'),
              o('preventive', 'Preventive health', 'निवारक स्वास्थ्य'),
              o('voting', 'Voting and civic participation', 'मतदान र नागरिक सहभागिता'),
              o('tenant', 'Tenant rights', 'भाडावालको अधिकार'),
              o('workplace', 'Workplace rights', 'कार्यस्थलको अधिकार'),
              o('digital', 'Digital skills for using online government services', 'अनलाइन सरकारी सेवा प्रयोग गर्ने डिजिटल सीप')
            ]
          }
        ]
      },

      /* ---------------------------------------------------------------- 4 */
      {
        id: 'health',
        title: { en: 'Health and Health Care Access', ne: 'स्वास्थ्य र स्वास्थ्य सेवा पहुँच' },
        questions: [
          {
            id: 'H1', type: 'single',
            en: 'Overall, how would you rate your health?',
            ne: 'समग्रमा तपाईं आफ्नो स्वास्थ्यलाई कसरी मूल्याङ्कन गर्नुहुन्छ?',
            options: [
              o('excellent', 'Excellent', 'उत्कृष्ट'),
              o('very_good', 'Very good', 'धेरै राम्रो'),
              o('good', 'Good', 'राम्रो'),
              o('fair', 'Fair', 'ठीकठाक'),
              o('poor', 'Poor', 'कमजोर'),
              NOWANT
            ]
          },
          {
            id: 'H2', type: 'single',
            en: 'Do you have your own primary care doctor or family doctor?',
            ne: 'के तपाईंको आफ्नै प्राथमिक स्वास्थ्य चिकित्सक हुनुहुन्छ? (Primary Care Doctor/Family Doctor)',
            options: [o('yes', 'Yes', 'छ'), o('no', 'No', 'छैन')]
          },
          {
            id: 'H3', type: 'single',
            en: 'What is your primary health insurance?', ne: 'तपाईंको मुख्य स्वास्थ्य बीमा कुन हो?',
            options: [
              o('employer', 'Employer or union insurance', 'रोजगारदाता वा युनियनको बीमा'),
              o('covered_ca', 'Covered California or other private insurance', 'Covered California वा अन्य निजी बीमा'),
              o('medi_cal', 'Medi-Cal', 'Medi-Cal'),
              o('medicare', 'Medicare', 'Medicare'),
              o('other_gov', 'Other government health insurance', 'अन्य सरकारी स्वास्थ्य बीमा'),
              o('military', 'Military or Veterans health insurance', 'सैन्य वा Veterans स्वास्थ्य बीमा'),
              o('ihs', 'Indian Health Service', 'इन्डियन हेल्थ सेवा (Indian Health Service)'),
              o('none', 'No health insurance', 'स्वास्थ्य बीमा छैन'),
              DK,
              REFUSE
            ]
          },
          {
            id: 'H4', type: 'single',
            en: 'How often do you have a routine health check-up?',
            ne: 'तपाईं नियमित स्वास्थ्य परीक्षण (Check-up) कति पटक गर्नुहुन्छ?',
            options: [
              o('yearly', 'Every year', 'हरेक वर्ष'),
              o('2_3_years', 'Every 2–3 years', 'प्रत्येक २–३ वर्षमा'),
              o('when_sick', 'Only when I am sick', 'बिरामी पर्दा मात्र'),
              o('never', 'Never', 'कहिल्यै गर्दिनँ')
            ]
          },
          {
            id: 'H5', type: 'single',
            en: 'Where do you usually go when you need health care?',
            ne: 'स्वास्थ्य सेवा आवश्यक पर्दा तपाईं सामान्यतया कहाँ जानुहुन्छ?',
            options: [
              o('regular_doctor', 'Regular doctor or clinic', 'नियमित डाक्टर वा क्लिनिक'),
              o('community_center', 'Community health center (county health center)', 'सामुदायिक (काउन्टी हेल्थ सेन्टर) स्वास्थ्य केन्द्र'),
              o('nonprofit', 'Health center operated by a nonprofit organization', 'गैरनाफामूलक संस्थाद्वारा सञ्चालित स्वास्थ्य केन्द्र'),
              o('urgent_care', 'Urgent care center', 'तत्काल उपचार केन्द्र (Urgent Care)'),
              o('er', 'Emergency room', 'आपत्कालीन कक्ष (Emergency)'),
              o('telehealth', 'Telehealth', 'टेलिहेल्थ'),
              o('no_regular', 'I do not have a regular place to go', 'मेरो नियमित जाने ठाउँ छैन'),
              o('no_care', 'I usually do not seek care', 'म सामान्यतया उपचार खोज्दिनँ')
            ]
          },
          {
            id: 'H6', type: 'single',
            en: 'During the past 12 months, was there a time when you needed health care but had to delay it or did not receive it?',
            ne: 'तपाईंलाई विगत १२ महिनामा स्वास्थ्य सेवा आवश्यक भए तापनि ढिलो गर्नुपरेको वा सेवा नपाएको कुनै समय थियो?',
            options: [o('yes', 'Yes', 'थियो'), o('no', 'No', 'थिएन'), NOTSURE, NOWANT]
          },
          {
            id: 'H7', type: 'multi', hint: ALL,
            showIf: { q: 'H6', in: ['yes', 'not_sure'] },
            en: 'If care was delayed or missed, what were the reasons?',
            ne: 'उपचार ढिलो भएको वा छुटेको भए कारण के-के थिए?',
            options: [
              o('cost', 'Cost or lack of insurance', 'खर्च वा बीमा नभएको'),
              o('no_provider', 'Could not find a provider', 'सेवा प्रदायक भेटाउन नसकेको'),
              o('wait', 'Long wait or no available appointment', 'लामो प्रतीक्षा वा अपोइन्टमेन्ट नपाएको'),
              o('language', 'Language or communication problems', 'भाषा वा सञ्चार समस्या'),
              o('transport', 'Transportation problems', 'यातायात समस्या'),
              o('work', 'Could not take time off work', 'कामबाट बिदा लिन नसकेको'),
              o('caregiving', 'Child care or other caregiving responsibilities', 'बालबालिका वा अरूको हेरचाह जिम्मेवारी'),
              o('didnt_know', 'Did not know where to go', 'कहाँ जाने थाहा नभएको'),
              o('immigration', 'Concern about immigration status or privacy', 'आप्रवासन स्थिति वा गोपनीयताको चिन्ता'),
              o('disrespected', 'Felt disrespected or not understood', 'सम्मान वा बुझाइ नपाएको महसुस'),
              o('not_delayed', 'Care was not delayed or missed', 'उपचार ढिलो भएन वा छुटेन', { exclusive: true })
            ]
          },
          {
            id: 'H8', type: 'multi', hint: ALL,
            en: 'Do you currently have any of the following health problems or conditions?',
            ne: 'के तपाईंलाई हाल निम्नमध्ये कुनै स्वास्थ्य समस्या वा अवस्था छ?',
            options: [
              o('hypertension', 'High blood pressure', 'उच्च रक्तचाप'),
              o('diabetes', 'Diabetes', 'मधुमेह'),
              o('heart', 'Heart disease', 'मुटुसम्बन्धी रोग'),
              o('asthma', 'Asthma, allergies, or other respiratory problems', 'दम, एलर्जी, वा अन्य श्वासप्रश्वाससम्बन्धी समस्या'),
              o('respiratory_symptoms', 'Respiratory symptoms (such as a persistent cough, shortness of breath, wheezing, chest tightness, or frequent colds)', 'श्वासप्रश्वाससम्बन्धी लक्षणहरू (जस्तै लगातार खोकी, सास फेर्न गाह्रो हुनु, घरघराहट, छाती कसिनु, वा बारम्बार रुघाखोकी लाग्नु)'),
              o('kidney', 'Kidney health problems', 'मिर्गौला स्वास्थ्यसम्बन्धी समस्या'),
              o('dental', 'Dental problems', 'दाँतको समस्या'),
              o('vision', 'Vision or eye problems', 'आँखाको समस्या'),
              o('mental', 'Mental health concerns (such as stress, anxiety, or depression)', 'मानसिक स्वास्थ्यसम्बन्धी समस्या (जस्तै तनाव, चिन्ता, वा उदासी)'),
              o('pain_disability', 'Chronic pain or physical disability', 'दीर्घ दुखाइ वा शारीरिक असक्षमता'),
              o('other_chronic', 'Other chronic health condition', 'अन्य दीर्घकालीन स्वास्थ्य समस्या'),
              o('none', 'None of these', 'यीमध्ये कुनै पनि छैन', { exclusive: true }),
              DK,
              NOWANT,
              OTHER('Other', 'अन्य (कृपया उल्लेख गर्नुहोस्)')
            ]
          },
          {
            id: 'H9', type: 'multi', hint: ALL,
            en: 'Does your family currently need additional help obtaining any of the following health services?',
            ne: 'हाल तपाईंको परिवारलाई निम्नमध्ये कुनै स्वास्थ्य सेवा प्राप्त गर्न थप सहायता चाहिएको छ?',
            options: [
              o('primary', 'Primary or preventive health care', 'प्राथमिक वा रोकथामसम्बन्धी स्वास्थ्य सेवा'),
              o('diabetes', 'Diabetes care', 'मधुमेहको उपचार'),
              o('heart', 'Blood pressure and heart health', 'रक्तचाप र मुटुको स्वास्थ्य'),
              o('asthma', 'Asthma, allergies, or other respiratory problems', 'दम, एलर्जी, वा अन्य श्वासप्रश्वाससम्बन्धी समस्या'),
              o('kidney', 'Kidney health', 'मिर्गौला स्वास्थ्य'),
              o('dental', 'Dental care', 'दाँतको उपचार'),
              o('vision', 'Vision or eye care', 'आँखाको उपचार'),
              o('mental', 'Mental health counseling', 'मानसिक स्वास्थ्य परामर्श'),
              o('prescriptions', 'Prescription medications', 'डाक्टरले लेखेको औषधि'),
              o('chronic', 'Chronic disease care', 'दीर्घरोगको उपचार'),
              o('womens', "Women's or reproductive health", 'महिला वा प्रजनन स्वास्थ्य'),
              o('maternal', 'Pregnancy or maternal health', 'गर्भावस्था वा मातृ स्वास्थ्य'),
              o('senior', 'Senior or in-home care', 'ज्येष्ठ नागरिक वा घरमै दिइने सेवा'),
              o('disability', 'Disability services', 'अपाङ्गता सेवा'),
              o('substance', 'Substance use or alcohol-related services', 'लागूपदार्थ वा मदिरा प्रयोगसम्बन्धी सेवा'),
              o('none', 'None of these', 'यीमध्ये कुनै होइन', { exclusive: true })
            ]
          },
          {
            id: 'H10', type: 'single',
            en: 'Have you heard of Direct Primary Care (DPC) before?',
            ne: 'Direct Primary Care (DPC) बारे तपाईंले पहिले सुन्नुभएको छ?',
            hint: {
              en: 'DPC uses a monthly membership to provide easier access to a physician, longer visits, and faster appointments.',
              ne: 'DPC मा मासिक सदस्यता लिएर चिकित्सकसँग सहज पहुँच, लामो भेटघाट, र छिटो अपोइन्टमेन्ट प्राप्त गर्न सकिन्छ।'
            },
            options: [o('yes', 'Yes', 'छ'), o('no', 'No', 'छैन')]
          },
          {
            id: 'H11', type: 'multi',
            hint: { en: 'You may select more than one.', ne: 'एकभन्दा बढी छनोट गर्न सक्नुहुन्छ।' },
            en: 'Which Direct Primary Care (DPC) features would be most useful to you?',
            ne: 'Direct Primary Care (DPC) का कुन सुविधा तपाईंलाई सबैभन्दा उपयोगी लाग्छ?',
            options: [
              o('same_day', 'Same-day or next-day appointments', 'सोही दिन वा भोलिपल्ट अपोइन्टमेन्ट'),
              o('longer_visits', 'Longer visits with a physician', 'चिकित्सकसँग लामो समयको भेटघाट'),
              o('direct_access', 'Direct access to a physician by phone or message', 'चिकित्सकसँग सिधै फोन वा सन्देशबाट सम्पर्क'),
              o('lower_cost', 'Lower-cost laboratory tests and medications', 'सस्तो प्रयोगशाला परीक्षण र औषधि'),
              o('chronic_mgmt', 'Ongoing management of chronic conditions (such as diabetes or high blood pressure)', 'दीर्घरोग (जस्तै मधुमेह, उच्च रक्तचाप) को नियमित व्यवस्थापन')
            ]
          }
        ]
      },

      /* ---------------------------------------------------------------- 5 */
      {
        id: 'basic_needs',
        title: { en: 'Housing, Food, Employment, Transportation, and Digital Access', ne: 'आवास, खाद्य, काम, यातायात र डिजिटल पहुँच' },
        intro: {
          en: 'You may skip any question you do not wish to answer.',
          ne: 'उत्तर दिन नचाहेको कुनै पनि प्रश्न छोड्न सक्नुहुन्छ।'
        },
        questions: [
          {
            id: 'B1', type: 'matrix',
            en: 'During the past 12 months, how much difficulty did you or your household experience in each area below?',
            ne: 'विगत १२ महिनामा तपाईं अथवा तपाईंको परिवारलाई तल उल्लेखित प्रत्येक क्षेत्रमा कतिको कठिनाइ भयो?',
            rows: [
              o('rent', 'Pay rent or a mortgage', 'घरभाडा वा घरकर्जा तिर्न'),
              o('stable_housing', 'Maintain stable and safe housing', 'स्थिर र सुरक्षित आवास कायम राख्न'),
              o('food', 'Obtain enough food', 'पर्याप्त खाना जुटाउन'),
              o('utilities', 'Pay utilities such as electricity, water, or gas', 'बिजुली, पानी, ग्यासजस्ता युटिलिटी तिर्न'),
              o('transport', 'Obtain reliable transportation', 'भरपर्दो यातायात पाउन'),
              o('childcare', 'Obtain affordable childcare', 'सुलभ बाल हेरचाह पाउन'),
              o('internet', 'Obtain internet access or a suitable device', 'इन्टरनेट वा उपयुक्त उपकरण पाउन'),
              o('health_costs', 'Pay for health care or medications', 'स्वास्थ्य उपचार वा औषधिको खर्च तिर्न'),
              o('income', 'Obtain stable work or sufficient income', 'स्थिर काम वा पर्याप्त आम्दानी पाउन'),
              o('legal', 'Obtain legal or immigration assistance', 'कानुनी वा आप्रवासन सहायता पाउन')
            ],
            cols: [
              o('none', 'No difficulty', 'कुनै कठिनाइ भएन'),
              o('slight', 'Slight difficulty', 'थोरै कठिनाइ'),
              o('moderate', 'Moderate difficulty', 'मध्यम कठिनाइ'),
              o('serious', 'Serious difficulty', 'गम्भीर कठिनाइ'),
              o('prefer_not', 'Prefer not to answer', 'उत्तर दिन चाहन्नँ')
            ]
          },
          {
            id: 'B2', type: 'single',
            en: 'Which option best describes your current housing situation?',
            ne: 'तपाईंको हालको आवास अवस्थालाई कुन विकल्पले सबैभन्दा राम्रोसँग वर्णन गर्छ?',
            options: [
              o('stable', 'I have stable housing and expect it to continue', 'स्थिर आवास छ र कायम रहने अपेक्षा छ'),
              o('worried', 'I am worried about losing my housing', 'आवास गुम्ने चिन्ता छ'),
              o('staying_with_others', 'I am temporarily staying with others', 'अस्थायी रूपमा अरूसँग बसिरहेको छु'),
              o('overcrowded', 'I live in overcrowded housing', 'अत्यधिक भीडभाड भएको घरमा बस्छु'),
              o('shelter', 'I live in a shelter, vehicle, or outdoors', 'आश्रयस्थल, सवारीसाधन वा बाहिर बस्छु'),
              o('repair', 'My home has serious repair or safety problems', 'घरमा गम्भीर मर्मत वा सुरक्षा समस्या छ'),
              NOWANT,
              OTHER()
            ]
          },
          {
            id: 'B3', type: 'matrix',
            en: 'During the past 12 months, because of a lack of money or other resources, did either of the following ever happen?',
            ne: 'विगत १२ महिनामा, पैसा वा अन्य स्रोतको कमीका कारण, के कहिल्यै यस्तो भएको थियो कि?',
            rows: [
              o('ran_out', 'Food began to run out before you had money to buy more', 'थप खाना किन्न पैसा हुनुअघि नै खाना सकिन थालेको'),
              o('didnt_last', 'The food you bought did not last, and you did not have money to buy more', 'किनेको खाना टिकेन र थप किन्न पैसा थिएन')
            ],
            cols: [
              o('never', 'Never', 'कहिल्यै होइन'),
              o('sometimes', 'Sometimes', 'कहिलेकाहीँ'),
              o('often', 'Often', 'प्रायः'),
              o('prefer_not', 'Prefer not to answer', 'उत्तर दिन चाहन्नँ')
            ]
          },
          {
            id: 'B4', type: 'single',
            en: 'During the past 12 months, did a lack of reliable transportation make it difficult for you to get to work, health care, school, shopping, or other essential activities?',
            ne: 'विगत १२ महिनामा भरपर्दो यातायात नभएकाले तपाईंलाई काम, स्वास्थ्य सेवा, विद्यालय, किनमेल वा अन्य आवश्यक काम गर्न गाह्रो भयो?',
            options: [o('yes', 'Yes', 'भयो'), o('no', 'No', 'भएन'), NOTSURE, NOWANT]
          },
          {
            id: 'B5', type: 'multi', hint: ALL,
            en: 'If employment or financial assistance programs are offered in the future, which programs would be useful to you?',
            ne: 'यदि भविष्यमा कुनै रोजगारी वा आर्थिक सहायता सम्बन्धी कार्यक्रम सञ्चालन गरिएमा, कुन कार्यक्रम तपाईंलाई उपयोगी हुन्छ?',
            options: [
              o('job_search', 'Job-search or job-placement assistance', 'काम खोज्ने वा जागिर मिलाउने सहयोग'),
              o('job_training', 'Job training or skills development', 'रोजगारी तालिम वा सीप विकास'),
              o('english_work', 'English classes for work', 'कामका लागि अंग्रेजी कक्षा'),
              o('digital', 'Computer or digital-skills training', 'कम्प्युटर वा डिजिटल सीप तालिम'),
              o('credentials', 'Recognition of foreign professional qualifications', 'विदेशी व्यावसायिक योग्यताको मान्यता'),
              o('small_business', 'Small-business assistance', 'सानो व्यवसाय सहयोग'),
              o('workplace_rights', 'Workplace-rights education', 'कार्यस्थल अधिकार शिक्षा'),
              o('financial_literacy', 'Financial literacy or tax assistance', 'वित्तीय साक्षरता वा कर सहायता'),
              o('childcare', 'Child care', 'बाल हेरचाह'),
              o('basic_needs', 'Food, housing, or utility assistance', 'खाद्य, आवास वा युटिलिटी सहायता'),
              OTHER(),
              o('none', 'None of these', 'यीमध्ये कुनै होइन', { exclusive: true })
            ]
          },
          {
            id: 'B6', type: 'single',
            en: 'Are you currently experiencing any serious problems with the safety of your housing, such as unsafe drinking water, mold or lead, heating, cooling, plumbing, electrical problems, or any other serious problems?',
            ne: 'के तपाईंको घरको सुरक्षासँग सम्बन्धित कुनै गम्भीर समस्या अहिले छ? उदाहरणका लागि, असुरक्षित पिउने पानी, ढुसी वा सिसा (लेड), तताउने वा चिस्याउने व्यवस्था, प्लम्बिङ, बिजुली, वा अन्य गम्भीर समस्या?',
            options: [o('yes', 'Yes', 'छ'), o('no', 'No', 'छैन'), DK, NOWANT2]
          }
        ]
      },

      /* ---------------------------------------------------------------- 6 */
      {
        id: 'wellbeing',
        sensitive: true,
        title: { en: 'Mental Health, Social Connection, and Safety', ne: 'मानसिक स्वास्थ्य, सामाजिक सम्बन्ध र सुरक्षा' },
        intro: {
          en: 'These questions are optional. Please do not provide names or details that could identify another person.',
          ne: 'यी प्रश्न वैकल्पिक हुन्। अर्को व्यक्तिको पहिचान खुल्ने नाम वा विवरण नदिनुहोस्।'
        },
        questions: [
          {
            id: 'M1', type: 'single',
            en: 'During the past two weeks, how often, if at all, did stress, anxiety, sadness, or emotional difficulties affect your daily activities?',
            ne: 'विगत दुई हप्तामा तनाव, चिन्ता, दुःख वा भावनात्मक कठिनाइले तपाईंको दैनिक काममा असर गर्‍यो, यदि गर्‍यो भने कति पटक असर गर्‍यो?',
            options: [
              o('not_at_all', 'Not at all', 'कहिल्यै गरेन'),
              o('several_days', 'Several days', 'केही दिन'),
              o('more_than_half', 'More than half the days', 'आधाभन्दा बढी दिन'),
              o('nearly_every_day', 'Nearly every day', 'लगभग हरेक दिन'),
              NOWANT
            ]
          },
          {
            id: 'M2', type: 'single',
            en: 'During the past month, how often did you feel lonely or socially isolated?',
            ne: 'विगत एक महिनामा तपाईंले कति पटक एक्लोपन वा सामाजिक अलगाव महसुस गर्नुभयो?',
            options: [
              o('never', 'Never', 'कहिल्यै होइन'),
              o('rarely', 'Rarely', 'विरलै'),
              o('sometimes', 'Sometimes', 'कहिलेकाहीँ'),
              o('often', 'Often', 'प्रायः'),
              o('always', 'Always', 'सधैँ'),
              NOWANT
            ]
          },
          {
            id: 'M3', type: 'single',
            en: 'If you or a family member needed mental health support, how comfortable would you feel seeking help?',
            ne: 'तपाईं वा परिवारका सदस्यलाई मानसिक स्वास्थ्य सहयोग चाहियो भने सहायता खोज्न कतिको सहज महसुस गर्नुहुन्छ?',
            options: [
              o('very', 'Very comfortable', 'धेरै सहज'),
              o('somewhat', 'Somewhat comfortable', 'केही सहज'),
              o('slightly', 'Slightly comfortable', 'थोरै सहज'),
              o('not', 'Not comfortable', 'सहज छैन'),
              NOTSURE
            ]
          },
          {
            id: 'M4', type: 'multi', hint: ALL,
            en: 'What might make it difficult to seek mental health support?',
            ne: 'मानसिक स्वास्थ्य सहयोग खोज्न कुन कुराले कठिन बनाउन सक्छ?',
            options: [
              o('cost', 'Cost or lack of insurance', 'खर्च वा बीमा नभएको'),
              o('didnt_know', 'Did not know where to go', 'कहाँ जाने थाहा नभएको'),
              o('no_nepali', 'No Nepali-speaking provider or interpreter', 'नेपाली बोल्ने सेवा प्रदायक वा दोभाषे नभएको'),
              o('privacy', 'Privacy concerns', 'गोपनीयताको चिन्ता'),
              o('stigma', 'Fear of judgment or stigma', 'आलोचना वा लाञ्छनाको डर'),
              o('family_culture', 'Family or cultural concerns', 'परिवार वा संस्कृतिसम्बन्धी चिन्ता'),
              o('wait', 'Long wait times', 'लामो प्रतीक्षा'),
              o('transport_schedule', 'Transportation or scheduling problems', 'यातायात वा समयको समस्या'),
              o('prefer_community', 'Prefer to seek support from family, community, or religious leaders', 'परिवार, समुदाय वा धार्मिक अगुवाबाट सहयोग लिन चाहने'),
              o('nothing', 'Nothing would prevent me from seeking help', 'मलाई सहायता खोज्न कुनै कुराले रोक्दैन', { exclusive: true })
            ]
          },
          {
            id: 'M5', type: 'multi', hint: ALL,
            en: 'Whom would you trust for emotional or mental health support?',
            ne: 'भावनात्मक वा मानसिक स्वास्थ्य सहयोगका लागि तपाईं कसलाई विश्वास गर्नुहुन्छ?',
            options: [
              o('family_friends', 'Family or friends', 'परिवार वा साथी'),
              o('nepali_counselor', 'Nepali-speaking counselor or therapist', 'नेपाली बोल्ने परामर्शदाता वा थेरापिस्ट'),
              o('doctor', 'Doctor or health care provider', 'डाक्टर वा स्वास्थ्य सेवा प्रदायक'),
              o('chw', 'Trained community health worker or trusted messenger', 'तालिमप्राप्त सामुदायिक स्वास्थ्यकर्मी वा विश्वासिलो सन्देशवाहक'),
              o('religious', 'Religious or spiritual leader', 'धार्मिक वा आध्यात्मिक अगुवा'),
              o('peer', 'Peer-support or wellness group', 'सहकर्मी सहायता वा स्वास्थ्य समूह'),
              o('school', 'School counselor', 'विद्यालय परामर्शदाता'),
              o('helpline', 'Confidential helpline or online service', 'गोप्य हेल्पलाइन वा अनलाइन सेवा'),
              o('not_sure', 'Not sure whom to trust', 'कसलाई विश्वास गर्ने निश्चित छैन', { exclusive: true })
            ]
          },
          {
            id: 'S1', type: 'matrix',
            en: 'How safe do you generally feel in the following places?',
            ne: 'निम्न ठाउँमा तपाईं सामान्यतया कतिको सुरक्षित महसुस गर्नुहुन्छ?',
            rows: [
              o('home', 'At home', 'घरमा'),
              o('neighborhood', 'In your neighborhood', 'आफ्नो टोलमा'),
              o('work_school', 'At work or school', 'काम वा विद्यालयमा')
            ],
            cols: [
              o('very_safe', 'Very safe', 'धेरै सुरक्षित'),
              o('usually_safe', 'Usually safe', 'प्रायः सुरक्षित'),
              o('sometimes_unsafe', 'Sometimes unsafe', 'कहिलेकाहीँ असुरक्षित'),
              o('very_unsafe', 'Very unsafe', 'धेरै असुरक्षित'),
              o('na', 'N/A', 'लागू हुँदैन'),
              o('prefer_not', 'Prefer not to answer', 'उत्तर दिन चाहन्नँ')
            ]
          },
          {
            id: 'S2', type: 'single',
            en: 'During the past 12 months, have you experienced unfair treatment, harassment, or threats because of your race, ethnicity, language, accent, religion, or immigrant background?',
            ne: 'विगत १२ महिनामा जाति, जातीयता, भाषा, उच्चारण, धर्म वा आप्रवासन पृष्ठभूमिका कारण तपाईंलाई अन्यायपूर्ण व्यवहार, दुर्व्यवहार वा धम्की भएको छ?',
            options: [o('yes', 'Yes', 'छ'), o('no', 'No', 'छैन'), NOTSURE, NOWANT]
          },
          {
            id: 'S3', type: 'single',
            en: 'Do you know where you or someone you know can obtain confidential help in a situation involving family or intimate-partner violence?',
            ne: 'तपाईं वा तपाईंले चिनेको कसैलाई पारिवारिक वा जोडीबाट हुने हिंसाको अवस्थामा गोप्य सहायता कहाँ पाइन्छ भन्ने थाहा छ?',
            options: [o('yes', 'Yes', 'छ'), o('no', 'No', 'छैन'), NOTSURE, NOWANT]
          }
        ]
      },

      /* ---------------------------------------------------------------- 7 */
      {
        id: 'priorities',
        title: { en: 'Community Priorities and Helpful Solutions', ne: 'सामुदायिक प्राथमिकता र उपयोगी समाधान' },
        questions: [
          {
            id: 'P1', type: 'single',
            en: 'How connected do you feel to the local Nepali community?',
            ne: 'तपाईंलाई स्थानीय नेपाली समुदायसँग कतिको जोडिएको महसुस हुन्छ?',
            options: [
              o('very', 'Very connected', 'धेरै जोडिएको'),
              o('somewhat', 'Somewhat connected', 'केही हदसम्म जोडिएको'),
              o('slightly', 'Slightly connected', 'थोरै जोडिएको'),
              o('not', 'Not connected', 'जोडिएको महसुस हुँदैन'),
              NOTSURE,
              o('want_more', 'I would like to feel more connected to the community', 'म समुदायसँग अझ बढी जोडिन चाहन्छु')
            ]
          },
          {
            id: 'P2', type: 'multi', hint: ALL,
            en: 'Which services should NANC and partner organizations prioritize?',
            ne: 'NANC र साझेदार संस्थाले कुन सेवालाई प्राथमिकता दिनुपर्छ?',
            options: [
              o('translation', 'Nepali translation of important materials', 'महत्त्वपूर्ण सामग्रीको नेपाली अनुवाद'),
              o('interpretation', 'Referrals to professional interpretation services', 'व्यावसायिक दोभाषे सेवामा रेफरल'),
              o('english_classes', 'English-language classes', 'अंग्रेजी भाषा कक्षा'),
              o('navigation', 'Community-service navigation and help completing forms', 'समुदाय सेवा मार्गदर्शन र फाराम भर्न सहयोग'),
              o('health_insurance', 'Health-insurance enrollment and health care navigation', 'स्वास्थ्य बीमा दर्ता र स्वास्थ्य सेवा मार्गदर्शन'),
              o('mental_health', 'Mental health, wellness, and support groups', 'मानसिक स्वास्थ्य, वेलनेस र सहायता समूह'),
              o('seniors', 'Senior activities and caregiver support', 'ज्येष्ठ नागरिक गतिविधि र हेरचाहकर्ता सहायता'),
              o('youth_parent', 'Youth and parent programs', 'युवा र अभिभावक कार्यक्रम'),
              o('kyr_civic', 'Know Your Rights and civic-engagement workshops', 'आफ्नो अधिकार र नागरिक सहभागिता कार्यशाला'),
              o('employment_digital', 'Employment and digital-skills training', 'रोजगार र डिजिटल सीप तालिम'),
              o('basic_needs', 'Referrals for housing, food, and emergency assistance', 'आवास, खाद्य र आपत्कालीन सहायता रेफरल'),
              o('cultural', 'Culturally rooted community gatherings', 'संस्कृतिमा आधारित सामुदायिक जमघट')
            ]
          },
          {
            id: 'P3', type: 'multi', hint: ALL,
            en: 'How should services be delivered to be useful?',
            ne: 'सेवाहरू कसरी उपलब्ध गराउँदा उपयोगी हुन्छ?',
            options: [
              o('nanc_center', 'At the NANC community center', 'NANC सामुदायिक केन्द्रमा'),
              o('other_local', 'At another local location', 'अर्को स्थानीय स्थानमा'),
              o('online_video', 'By online video', 'अनलाइन भिडियोमार्फत'),
              o('telephone', 'By telephone', 'टेलिफोनबाट'),
              o('whatsapp', 'Through WhatsApp', 'WhatsApp मार्फत'),
              o('one_on_one', 'One-on-one', 'एक-एक जनालाई'),
              o('small_groups', 'In small groups', 'सानो समूहमा'),
              o('events', 'At cultural or community events', 'सांस्कृतिक वा सामुदायिक कार्यक्रममा'),
              o('at_home', 'At home for people who cannot travel', 'यात्रा गर्न नसक्ने व्यक्तिका लागि घरमै')
            ]
          },
          {
            id: 'P4', type: 'multi', hint: ALL,
            en: 'What times would make it easiest for you to participate?',
            ne: 'तपाईंलाई सहभागी हुन कुन समय सजिलो हुन्छ?',
            options: [
              o('weekday_morning', 'Weekday mornings', 'कामकाजी दिनको बिहान'),
              o('weekday_afternoon', 'Weekday afternoons', 'कामकाजी दिनको दिउँसो'),
              o('weekday_evening', 'Weekday evenings', 'कामकाजी दिनको साँझ'),
              o('saturday', 'Saturdays', 'शनिबार'),
              o('sunday', 'Sundays', 'आइतबार')
            ]
          },
          {
            id: 'P5', type: 'single',
            en: 'Would you be interested in participating in a future NANC focus group or community discussion?',
            ne: 'के तपाईं NANC ले भविष्यमा गर्न लागेको केन्द्रित समूह छलफल (फोकस ग्रुप) वा सामुदायिक छलफलमा सहभागी हुन चाहनुहुन्छ?',
            options: [o('yes', 'Yes', 'हो'), o('no', 'No', 'होइन'), o('maybe', 'Maybe', 'सायद')]
          }
        ]
      }
    ]
  };
})();
