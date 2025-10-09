import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    const { data: activeInvestments, error: investmentsError } = await supabase
      .from('investments')
      .select('*, plan:investment_plans(*)')
      .eq('status', 'active');

    if (investmentsError) throw investmentsError;

    let totalProcessed = 0;
    let totalEarnings = 0;

    for (const investment of activeInvestments || []) {
      const { data: existingEarning } = await supabase
        .from('earnings')
        .select('id')
        .eq('investment_id', investment.id)
        .eq('date', today)
        .maybeSingle();

      if (existingEarning) {
        continue;
      }

      const dailyReturn = (investment.amount * investment.plan.daily_return_percentage) / 100;

      const { error: earningError } = await supabase.from('earnings').insert({
        investment_id: investment.id,
        user_id: investment.user_id,
        amount: dailyReturn,
        date: today,
      });

      if (earningError) {
        console.error('Error creating earning:', earningError);
        continue;
      }

      const newTotalEarned = investment.total_earned + dailyReturn;

      const { error: updateInvestmentError } = await supabase
        .from('investments')
        .update({
          total_earned: newTotalEarned,
          last_payout_date: new Date().toISOString(),
        })
        .eq('id', investment.id);

      if (updateInvestmentError) {
        console.error('Error updating investment:', updateInvestmentError);
        continue;
      }

      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('balance, total_earnings')
        .eq('id', investment.user_id)
        .maybeSingle();

      if (!profileFetchError && profile) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({
            balance: profile.balance + dailyReturn,
            total_earnings: profile.total_earnings + dailyReturn,
            updated_at: new Date().toISOString(),
          })
          .eq('id', investment.user_id);

        if (updateProfileError) {
          console.error('Error updating profile:', updateProfileError);
          continue;
        }
      }

      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: investment.user_id,
        type: 'earning',
        amount: dailyReturn,
        status: 'completed',
        description: `Daily return from ${investment.plan.name}`,
      });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
      }

      const startDate = new Date(investment.start_date);
      const endDate = new Date(investment.end_date);
      const now = new Date();

      if (now >= endDate) {
        await supabase
          .from('investments')
          .update({ status: 'completed' })
          .eq('id', investment.id);
      }

      totalProcessed++;
      totalEarnings += dailyReturn;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily earnings calculated successfully',
        processed: totalProcessed,
        totalEarnings: totalEarnings.toFixed(2),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});