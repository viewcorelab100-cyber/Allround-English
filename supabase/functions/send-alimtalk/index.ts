// Supabase Edge Function: 알림톡 발송 (채점 완료 등)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// 알리고 API 설정 (환경변수로 관리)
const ALIGO_API_KEY = Deno.env.get('ALIGO_API_KEY') || '';
const ALIGO_USER_ID = Deno.env.get('ALIGO_USER_ID') || '';
const ALIGO_SENDER = Deno.env.get('ALIGO_SENDER') || '';
const ALIGO_SENDER_KEY = Deno.env.get('ALIGO_SENDER_KEY') || '';
// Supabase 설정
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// 테스트 모드 설정
const TEST_MODE = Deno.env.get('ALIMTALK_TEST_MODE') === 'true';
const TEST_PHONE = Deno.env.get('ALIMTALK_TEST_PHONE') || '01095592139';
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { phone, message, templateCode, templateParams, submissionId, feedbackId, recipientType, userId } = await req.json();
    if (!phone) {
      throw new Error('전화번호는 필수입니다.');
    }
    if (!message && !templateCode) {
      throw new Error('메시지 내용 또는 템플릿 코드가 필요합니다.');
    }
    let cleanPhone = phone.replace(/[-\s()]/g, '');
    if (TEST_MODE) {
      console.log(`[테스트 모드] 원본 번호 ${cleanPhone} → 테스트 번호 ${TEST_PHONE}로 대체`);
      cleanPhone = TEST_PHONE;
    }
    const phoneRegex = /^01[0-9]{8,9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      throw new Error(`유효하지 않은 전화번호입니다: ${cleanPhone}`);
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let result = {
      success: false,
      message: '',
      method: ''
    };
    if (ALIGO_API_KEY && ALIGO_USER_ID && ALIGO_SENDER && ALIGO_SENDER_KEY && templateCode) {
      try {
        const formData = new FormData();
        formData.append('apikey', ALIGO_API_KEY);
        formData.append('userid', ALIGO_USER_ID);
        formData.append('senderkey', ALIGO_SENDER_KEY);
        formData.append('tpl_code', templateCode);
        formData.append('sender', ALIGO_SENDER);
        formData.append('receiver_1', cleanPhone);
        formData.append('subject_1', '[올라운드영어] 채점 완료 안내');
        if (templateParams) {
          Object.keys(templateParams).forEach((key)=>{
            formData.append(`${key}_1`, templateParams[key]);
          });
        }
        const aligoResponse = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
          method: 'POST',
          body: formData
        });
        const aligoResult = await aligoResponse.json();
        if (aligoResult.code === '0') {
          result = {
            success: true,
            message: '알림톡 발송 성공',
            method: 'alimtalk'
          };
        } else {
          console.log('알림톡 실패, SMS로 폴백:', aligoResult.message);
          const smsResult = await sendSmsFallback(cleanPhone, message);
          result = smsResult;
        }
      } catch (aligoError) {
        console.error('알리고 알림톡 API 오류:', aligoError);
        const smsResult = await sendSmsFallback(cleanPhone, message);
        result = smsResult;
      }
    } else if (message) {
      const smsResult = await sendSmsFallback(cleanPhone, message);
      result = smsResult;
    } else {
      console.log('알림톡 발송 시뮬레이션:', {
        phone: cleanPhone,
        templateCode,
        message
      });
      result = {
        success: true,
        message: '알림톡 발송 시뮬레이션 (API 키 미설정)',
        method: 'simulation'
      };
    }
    if (submissionId || userId) {
      try {
        await supabase.from('notification_logs').insert({
          user_id: userId || null,
          submission_id: submissionId || null,
          feedback_id: feedbackId || null,
          notification_type: 'grading_complete',
          recipient_type: recipientType || 'student',
          phone_number: phone,
          phone_number_formatted: cleanPhone,
          status: result.success ? 'sent' : 'failed',
          provider: result.method || 'aligo',
          message_content: message,
          error_message: result.success ? null : result.message,
          response_data: result,
          sent_at: result.success ? new Date().toISOString() : null
        });
      } catch (logError) {
        console.error('알림 로그 저장 오류:', logError);
      }
    }
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('알림톡 발송 오류:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
async function sendSmsFallback(phone, message) {
  try {
    const messageBytes = new TextEncoder().encode(message).length;
    const msgType = messageBytes > 90 ? 'LMS' : 'SMS';
    const formData = new FormData();
    formData.append('key', ALIGO_API_KEY);
    formData.append('user_id', ALIGO_USER_ID);
    formData.append('sender', ALIGO_SENDER);
    formData.append('receiver', phone);
    formData.append('msg', message);
    formData.append('msg_type', msgType);
    formData.append('testmode_yn', TEST_MODE ? 'Y' : 'N');
    const smsResponse = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      body: formData
    });
    const smsResult = await smsResponse.json();
    if (smsResult.result_code === '1') {
      return {
        success: true,
        message: `${msgType} 발송 성공`,
        method: msgType.toLowerCase()
      };
    } else {
      return {
        success: false,
        message: smsResult.message || `${msgType} 발송 실패`,
        method: msgType.toLowerCase()
      };
    }
  } catch (error) {
    console.error('SMS 폴백 오류:', error);
    return {
      success: false,
      message: 'SMS 폴백 실패',
      method: 'sms'
    };
  }
}
