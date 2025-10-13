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
  const checkRedirect = async () => {
    if (hasProfile) router.push('/profile');
    else setLoading(false);
  };

  useEffect(() => {
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
    checkRedirect();
  }, [user]);

  const handleSubmit = async (registrationData) => {
    try {
      // Upload resume file if provided
      if (resumeFile) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('fileName', `${user.id}_${resumeFile.name}`);
        formData.append('studyLevel', registrationData.studyLevel || 'Unknown');
        formData.append('major', registrationData.major || 'Unknown');

        console.log('[Register] 開始上傳履歷...');

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
      }

      await RequestHelper.post<Registration, any>('/api/applications', {}, registrationData);
      alert('註冊成功！');
      updateProfile(registrationData);
      router.push('/profile');
    } catch (error) {
      console.error(error);
      alert('註冊失敗，請稍後再試。如果問題持續，請聯繫管理員。');
    }
  };

  if (!user) {
    router.push('/auth');
    return <LoadIcon width={200} height={200} />;
  }

  if (loading) {
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
    <div className="flex flex-col flex-grow bg-white pt-14">
      <Head>
        <title>註冊 | Register</title>
        <meta name="description" content="註冊參加 2025 RWA 黑客松台灣" />
        <link rel="icon" href="/favicon.ico?v=2.0" />
      </Head>

      <section id="jumbotron" className="p-2 px-6">
        <div className="max-w-4xl py-6 mx-auto flex flex-col items-center">
          <div className="registrationTitle text-4xl font-bold text-center">註冊</div>
          <div className="text-1xl my-4 font-bold font-small text-center">
            請填寫以下欄位。完成申請表格大約需要 5 分鐘。
          </div>
        </div>
      </section>

      <section className="flex justify-center">
        <Formik
          initialValues={formInitialValues}
          //validation
          //Get condition in which values.[value] is invalid and set error message in errors.[value]. Value is a value from the form(look at initialValues)
          validate={(values) => {
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

            return errors;
          }}
          onSubmit={async (values, { setSubmitting }) => {
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
                <div className="my-8">
                  <button
                    type="submit"
                    className="mr-auto cursor-pointer px-4 py-2 rounded-md bg-blue-200 hover:bg-blue-300"
                    onClick={() => setFormValid(!(!isValid || !dirty))}
                  >
                    提交
                  </button>
                  {!isValid && !formValid && (
                    <div className="text-red-600">錯誤：表單中有無效的欄位</div>
                  )}
                </div>
              </Form>
            );
          }}
        </Formik>
      </section>
    </div>
  );
}
