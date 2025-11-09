import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import LoadIcon from '../components/LoadIcon';
import { useUser } from '../lib/profile/user-data';
import { RequestHelper } from '../lib/request-helper';
import { useAuthContext } from '../lib/user/AuthContext';
import firebase from 'firebase/app';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import schools from '../public/schools.json';
import majors from '../public/majors.json';
import { hackPortalConfig, formInitialValues } from '../hackportal.config';
import DisplayQuestion from '../components/registerComponents/DisplayQuestion';

/**
 * The registration page.
 *
 * Registration: /
 */

export async function getServerSideProps() {
  return { props: {} }; // Force SSR, disable static generation
}

export default function Register() {
  const router = useRouter();

  const {
    registrationFields: {
      generalQuestions,
      schoolQuestions,
      hackathonExperienceQuestions,
      eventInfoQuestions,
      sponsorInfoQuestions,
    },
  } = hackPortalConfig;

  const { user, hasProfile, updateProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [formValid, setFormValid] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  
  const checkRedirect = async () => {
    if (typeof window === 'undefined') return; // Skip on server
    
    // 檢查數據庫中的註冊狀態
    if (user?.id && user?.token) {
      console.log('[Register] 🔍 Checking if user is already registered:', user.id);
      try {
        const response = await fetch(`/api/userinfo?id=${encodeURIComponent(user.id)}`, {
          headers: { Authorization: user.token },
        });
        
        if (response.status === 200) {
          console.log('[Register] ✅ User already registered, redirecting to /profile');
          router.push('/profile');
          return;
        } else {
          console.log('[Register] ❌ User not registered yet (status:', response.status, ')');
          setIsRegistered(false);
        }
      } catch (error) {
        console.error('[Register] Error checking registration:', error);
        setIsRegistered(false);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server
    setTimeout(() => {
      //load json data into dropdown list for universities and majors
      if (document.getElementById('schools') !== null) {
        for (let school of schools) {
          let option = document.createElement('option');
          option.text = school['university'];
          option.value = school['university'];
          let select = document.getElementById('schools');
          select.appendChild(option);
        }
      }

      if (document.getElementById('majors') !== null) {
        for (let major of majors) {
          let option = document.createElement('option');
          option.text = major['major'];
          option.value = major['major'];
          let select = document.getElementById('majors');
          select.appendChild(option);
        }
      }
    }, 0);
    //setting user specific initial values
    formInitialValues['id'] = user?.id || '';
    formInitialValues['preferredEmail'] = user?.preferredEmail || '';
    formInitialValues['firstName'] = user?.firstName || '';
    formInitialValues['lastName'] = user?.lastName || '';
    formInitialValues['permissions'] = user?.permissions || ['hacker'];
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server

    // Redirect to auth if no user
    if (!user) {
      router.push('/auth');
      return;
    }

    checkRedirect();
  }, [user]);

  const handleSubmit = async (registrationData) => {
    console.log('========================================');
    console.log('[Register] 🚀 STEP 1: 開始註冊流程');
    console.log('[Register] User ID:', user?.id);
    console.log('[Register] User Email:', user?.preferredEmail);
    console.log('[Register] Registration Data Keys:', Object.keys(registrationData));
    console.log('========================================');

    try {
      // Upload resume file if provided
      if (resumeFile) {
        console.log('[Register] 📄 STEP 2: 開始上傳履歷...');
        console.log('[Register] Resume file name:', resumeFile.name);
        console.log('[Register] Resume file size:', resumeFile.size);

        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('fileName', `${user.id}_${resumeFile.name}`);
        formData.append('studyLevel', registrationData.studyLevel || 'Unknown');
        formData.append('major', registrationData.major || 'Unknown');

        try {
          const uploadResponse = await fetch('/api/resume/upload', {
            method: 'POST',
            body: formData,
          });

          const uploadResult = await uploadResponse.json();

          if (uploadResult.success) {
            console.log('[Register] ✅ 履歷上傳成功');
            // Store the filename in the registration data
            registrationData.resume = `${user.id}_${resumeFile.name}`;
          } else {
            console.error('[Register] ❌ 履歷上傳失敗:', uploadResult.message);
            alert(
              `履歷上傳失敗：${uploadResult.message}\n\n註冊將繼續，但您需要稍後在個人資料頁面重新上傳履歷。`,
            );
            // Store filename anyway so user knows they tried to upload
            registrationData.resume = `${user.id}_${resumeFile.name}`;
          }
        } catch (uploadError: any) {
          console.error('[Register] ❌ 履歷上傳錯誤:', uploadError);
          alert(
            `履歷上傳發生錯誤：${uploadError.message}\n\n註冊將繼續，但您需要稍後在個人資料頁面重新上傳履歷。`,
          );
          // Store filename anyway
          registrationData.resume = `${user.id}_${resumeFile.name}`;
        }
      } else {
        console.log('[Register] ⏭️ STEP 2: 跳過履歷上傳（無檔案）');
      }

      // Get the user's auth token
      console.log('[Register] 🔑 STEP 3: 獲取認證 token...');
      const token = user?.token || (await firebase.auth().currentUser?.getIdToken());

      console.log('[Register] Token 來源:', user?.token ? 'user.token' : 'firebase.auth()');
      console.log('[Register] Token 長度:', token?.length || 0);
      console.log('[Register] Token 前50字元:', token?.substring(0, 50));

      if (!token) {
        console.error('[Register] ❌ 無法獲取 token');
        alert('無法獲取認證 token，請重新登入。');
        return;
      }

      console.log('[Register] ✅ Token 獲取成功');
      console.log('[Register] 📤 STEP 4: 準備發送 API 請求...');
      console.log('[Register] API URL:', '/api/applications');
      console.log('[Register] Authorization Header:', `Bearer ${token.substring(0, 30)}...`);
      console.log('[Register] 註冊資料:', JSON.stringify(registrationData, null, 2));

      const response = await RequestHelper.post<Registration, any>(
        '/api/applications',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        registrationData,
      );

      console.log('[Register] 📥 STEP 5: 收到 API 響應');
      console.log('[Register] 響應狀態碼:', response.status);
      console.log('[Register] 響應數據:', JSON.stringify(response.data, null, 2));

      // Check if the registration was successful
      if (response.status !== 200) {
        console.error('========================================');
        console.error('[Register] ❌ STEP 6: 註冊失敗');
        console.error('[Register] 狀態碼:', response.status);
        console.error('[Register] 錯誤訊息:', response.data?.message);
        console.error('[Register] 完整響應:', JSON.stringify(response, null, 2));
        console.error('========================================');
        alert(
          `註冊失敗：${response.data?.message || '請稍後再試'}\n\n如果問題持續，請聯繫管理員。`,
        );
        return;
      }

      console.log('========================================');
      console.log('[Register] ✅ STEP 6: 註冊成功！');
      console.log('[Register] 用戶 ID:', response.data?.userId);
      console.log('[Register] Profile:', response.data?.profile);
      console.log('[Register] Current user state:', {
        id: user?.id,
        email: user?.preferredEmail,
        token: user?.token ? 'exists' : 'missing',
      });
      console.log('========================================');

      // 更新 profile，這樣 AuthContext 就知道用戶已註冊
      updateProfile(response.data?.profile || registrationData);
      
      console.log('[Register] ✅ Profile updated in AuthContext');
      console.log('[Register] User should now be signed in and registered');

      alert('註冊成功！');

      console.log('[Register] 🕐 等待 500ms 讓後端處理完成...');
      // Wait a moment for the backend to fully process the data
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('[Register] 🔄 重定向到 /profile');
      router.push('/profile');
    } catch (error: any) {
      console.error('========================================');
      console.error('[Register] ❌❌❌ CRITICAL ERROR ❌❌❌');
      console.error('[Register] Error name:', error.name);
      console.error('[Register] Error message:', error.message);
      console.error('[Register] Error stack:', error.stack);
      console.error(
        '[Register] Full error:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );
      console.error('========================================');
      alert(`註冊失敗：${error.message || '請稍後再試'}\n\n如果問題持續，請聯繫管理員。`);
    }
  };

  if (!user || loading) {
    return <LoadIcon width={200} height={200} />;
  }

  //disables submitting form on enter key press
  function onKeyDown(keyEvent) {
    if ((keyEvent.charCode || keyEvent.keyCode) === 13) {
      keyEvent.preventDefault();
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('檔案大小不能超過 5MB');
        event.target.value = '';
        return;
      }
      setResumeFile(file);
    }
  };

  const setErrors = (obj, values, errors) => {
    if (obj.textInputQuestions)
      for (let inputObj of obj.textInputQuestions) {
        if (inputObj.required) {
          if (!values[inputObj.name]) errors[inputObj.name] = '必填';
        }
      }
    if (obj.numberInputQuestions)
      for (let inputObj of obj.numberInputQuestions) {
        if (inputObj.required) {
          if (!values[inputObj.name] && values[inputObj.name] !== 0) errors[inputObj.name] = '必填';
        }
      }
    if (obj.dropdownQuestions)
      for (let inputObj of obj.dropdownQuestions) {
        if (inputObj.required) {
          if (!values[inputObj.name]) errors[inputObj.name] = '必填';
        }
      }
    if (obj.checkboxQuestions)
      for (let inputObj of obj.checkboxQuestions) {
        if (inputObj.required) {
          if (!values[inputObj.name]) errors[inputObj.name] = '必填';
        }
      }
    if (obj.datalistQuestions)
      for (let inputObj of obj.datalistQuestions) {
        if (inputObj.required) {
          if (!values[inputObj.name]) errors[inputObj.name] = '必填';
        }
      }
    if (obj.textAreaQuestions)
      for (let inputObj of obj.textAreaQuestions) {
        if (inputObj.required) {
          if (!values[inputObj.name]) errors[inputObj.name] = '必填';
        }
      }
    if (obj.fileUploadQuestions)
      for (let inputObj of obj.fileUploadQuestions) {
        if (inputObj.required) {
          if (!resumeFile) errors[inputObj.name] = '必填';
        }
      }

    return errors;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>註冊 | Register</title>
        <meta name="description" content="註冊參加 2025 RWA 黑客松台灣" />
        <link rel="icon" href="/favicon.ico?v=2.0" />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            註冊
          </h1>
          <p className="text-lg text-gray-700 mt-4">
            請填寫以下欄位。完成申請表格大約需要 5 分鐘。
          </p>
        </div>

        <section className="flex justify-center">
          <Formik
            initialValues={formInitialValues}
            //validation
            //Get condition in which values.[value] is invalid and set error message in errors.[value]. Value is a value from the form(look at initialValues)
            validate={(values) => {
              console.log('========================================');
              console.log('[Register] 📋 表單驗證開始');
              console.log('[Register] 表單值:', values);
              console.log('========================================');

              var errors: any = {};
              for (let obj of generalQuestions) {
                errors = setErrors(obj, values, errors);
              }
              for (let obj of schoolQuestions) {
                errors = setErrors(obj, values, errors);
              }
              for (let obj of hackathonExperienceQuestions) {
                errors = setErrors(obj, values, errors);
              }
              for (let obj of eventInfoQuestions) {
                errors = setErrors(obj, values, errors);
              }
              for (let obj of sponsorInfoQuestions) {
                errors = setErrors(obj, values, errors);
              }

              //additional custom error validation
              if (
                values.preferredEmail &&
                !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.preferredEmail)
              ) {
                //regex matches characters before @, characters after @, and 2 or more characters after . (domain)
                errors.preferredEmail = '電子郵件地址無效';
              }

              console.log('========================================');
              console.log('[Register] 📋 表單驗證結果');
              console.log('[Register] 錯誤數量:', Object.keys(errors).length);
              if (Object.keys(errors).length > 0) {
                console.error('[Register] ❌ 驗證失敗的欄位:');
                Object.keys(errors).forEach((key) => {
                  console.error(`  - ${key}: ${errors[key]}`);
                });
              } else {
                console.log('[Register] ✅ 所有欄位驗證通過');
              }
              console.log('========================================');

              return errors;
            }}
            onSubmit={async (values, { setSubmitting }) => {
              console.log('========================================');
              console.log('[Register] 📝 Formik onSubmit 觸發');
              console.log('[Register] 提交的值:', values);
              console.log('========================================');

              await new Promise((r) => setTimeout(r, 500));
              let finalValues: any = values;
              //add user object
              const userValues: any = {
                id: values.id,
                firstName: values.firstName,
                lastName: values.lastName,
                preferredEmail: values.preferredEmail,
                permissions: values.permissions,
              };
              finalValues['user'] = userValues;
              //delete unnecessary values
              delete finalValues.firstName;
              delete finalValues.lastName;
              delete finalValues.permissions;
              delete finalValues.preferredEmail;

              console.log('[Register] 準備調用 handleSubmit...');
              //submitting
              handleSubmit(values);
              setSubmitting(false);
              // alert(JSON.stringify(values, null, 2)); //Displays form results on submit for testing purposes
            }}
          >
            {({ values, handleChange, isValid, dirty }) => {
              // Combined change handler for both regular inputs and file inputs
              const combinedHandleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                if (event.target.type === 'file') {
                  handleFileChange(event);
                } else {
                  handleChange(event);
                }
              };

              return (
                // Field component automatically hooks input to form values. Use name attribute to match corresponding value
                // ErrorMessage component automatically displays error based on validation above. Use name attribute to match corresponding value
                <Form
                  onKeyDown={onKeyDown}
                  noValidate
                  className="registrationForm flex flex-col max-w-4xl px-6 w-[56rem] text-lg"
                >
                  <div className="text-2xl py-1 border-b-2 border-black mr-auto mt-8">基本資料</div>
                  {generalQuestions.map((obj, idx) => (
                    <DisplayQuestion
                      key={idx}
                      obj={obj}
                      values={values}
                      onChange={combinedHandleChange}
                    />
                  ))}

                  <div className="text-2xl py-1 border-b-2 border-black mr-auto mt-8">
                    額外資訊（可選填）
                  </div>
                  {sponsorInfoQuestions.map((obj, idx) => (
                    <DisplayQuestion
                      key={idx}
                      obj={obj}
                      values={values}
                      onChange={combinedHandleChange}
                    />
                  ))}

                  {/* Submit */}
                  <div className="my-8 flex flex-col items-start gap-3">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-md text-sm font-medium transition-colors duration-300"
                      style={{
                        backgroundColor: '#1a3a6e',
                        color: 'white',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2a4a7e';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a3a6e';
                      }}
                      onClick={() => {
                        console.log('========================================');
                        console.log('[Register] 🖱️ 點擊提交按鈕');
                        console.log('[Register] isValid:', isValid);
                        console.log('[Register] dirty:', dirty);
                        console.log('[Register] formValid:', formValid);
                        console.log('========================================');
                        setFormValid(!(!isValid || !dirty));
                      }}
                    >
                      提交
                    </button>
                    {!isValid && !formValid && (
                      <div className="text-red-600 text-sm mt-2">
                        ❌ 錯誤：表單中有無效的欄位（請檢查瀏覽器 Console 查看詳細錯誤）
                      </div>
                    )}
                  </div>
                </Form>
              );
            }}
          </Formik>
        </section>
      </div>
    </div>
  );
}
