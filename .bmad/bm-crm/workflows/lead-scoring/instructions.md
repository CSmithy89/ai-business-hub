# Lead Scoring Workflow

<step n="1" goal="Gather Data">
  <action>Retrieve contact details for {{contact_id}}</action>
  <action>Retrieve associated account firmographics</action>
  <action>Retrieve recent activity history (90 days)</action>
</step>

<step n="2" goal="Calculate Components">
  <agent name="Scout">
    <action>Calculate Firmographic Score (Weight: 40%)</action>
    <action>Calculate Behavioral Score (Weight: 35%)</action>
    <action>Calculate Intent Score (Weight: 25%)</action>
  </agent>
</step>

<step n="3" goal="Determine Tier">
  <agent name="Scout">
    <action>Sum component scores</action>
    <action>Compare against tenant tier thresholds</action>
    <action>Assign Tier: COLD | WARM | HOT | SALES_READY</action>
  </agent>
</step>

<step n="4" goal="Update & Notify">
  <action>Update contact record with new Score and Tier</action>
  <check if="tier_changed">
    <action>Log 'Tier Change' activity</action>
    <check if="tier == 'SALES_READY'">
      <action>Trigger 'High Priority Lead' notification to Owner</action>
    </check>
  </check>
</step>
