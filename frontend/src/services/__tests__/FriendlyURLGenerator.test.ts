import FriendlyURLGenerator from "../FriendlyURLGenerator";

describe("generateFromDashboardName", () => {
  test("generates a sanitized URL", () => {
    const scenarios = [
      {
        dashboardName: "COVID-19",
        expectedUrl: "covid-19",
      },
      {
        dashboardName: "La Construcción",
        expectedUrl: "la-construcción",
      },
      {
        dashboardName: "Jen'O Brien",
        expectedUrl: "jen-o-brien",
      },
      {
        dashboardName: "Performance Dashboard @ AWS",
        expectedUrl: "performance-dashboard-aws",
      },
      {
        dashboardName: "This is - great",
        expectedUrl: "this-is-great",
      },
      {
        dashboardName: "A Construção",
        expectedUrl: "a-construção",
      },
      {
        dashboardName: "訳サービスで、テキストや",
        expectedUrl: "訳サービスで、テキストや",
      },
      {
        dashboardName: "!	#	$	&	'	(	)	*	+	,	/	:	;	=	?	@	[	] hi",
        expectedUrl: "hi",
      },
    ];

    scenarios.forEach((scenario) => {
      expect(
        FriendlyURLGenerator.generateFromDashboardName(scenario.dashboardName)
      ).toEqual(scenario.expectedUrl);
    });
  });
});
