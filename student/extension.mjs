// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
const DEVICE_STATUS_LABELS = {
  compliant: '보안 기준 충족',
  noncompliant: '보안 기준 미충족',
  unknown: '확인 불가',
};

const SESSION_STATUS_LABELS = {
  active: '활성',
  expired: '만료',
  revoked: '철회됨',
  unknown: '확인 불가',
};

const MODE_LABELS = {
  demo: '예제 자료',
  disconnected: '연결 없음',
  unknown: '확인 불가',
};

const ACCESS_STATUS_LABELS = {
  allowed: '허용',
  denied: '거부',
  unknown: '확인 불가',
};

const EVENT_KIND_LABELS = {
  access: '접속',
  xdr: 'XDR 경보',
};

function formatDeviceStatus(status) {
  return DEVICE_STATUS_LABELS[status] || '확인 불가';
}

function formatSessionStatus(status) {
  return SESSION_STATUS_LABELS[status] || '확인 불가';
}

function formatAccessStatus(status) {
  return ACCESS_STATUS_LABELS[status] || '확인 불가';
}

function formatStateDetail(value, labelMap) {
  if (!value || value === 'unknown') {
    return '확인 불가(unknown)';
  }
  const label = labelMap[value] || '확인 불가';
  return `${label}(${value})`;
}

function getModeText(mode) {
  return MODE_LABELS[mode] || null;
}

export function createStudentView() {
  return {
    renderIdentity(context = {}) {
      const { me, devices, sessions } = context || {};
      const container = document.createElement('div');
      container.className = 'student-identity-container';

      const mode = me?.mode || devices?.mode || sessions?.mode;
      const modeText = getModeText(mode);

      if (me?.status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '불러오는 중';
        container.appendChild(loadingEl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      if (me?.status === 'error') {
        const errorEl = document.createElement('p');
        errorEl.className = 'student-error';
        const message = me.error?.message ? `연결 실패: ${me.error.message}` : '서버에 연결하지 못했습니다.';
        errorEl.textContent = message;
        container.appendChild(errorEl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      if (me?.status === 'ok') {
        const data = me.data || {};
        const user = data.user || {};
        const device = data.device || {};
        const session = data.session || {};

        const dl = document.createElement('dl');
        dl.className = 'identity';

        // 사용자
        const dtUser = document.createElement('dt');
        dtUser.textContent = '사용자';
        const ddUser = document.createElement('dd');
        ddUser.textContent = user.label || user.id || '확인 불가';
        dl.appendChild(dtUser);
        dl.appendChild(ddUser);

        // 기기
        const dtDevice = document.createElement('dt');
        dtDevice.textContent = '기기';
        const ddDevice = document.createElement('dd');
        const deviceName = device.label || device.id || '확인 불가';
        const deviceStatusText = formatDeviceStatus(device.status);
        ddDevice.textContent = `${deviceName} · ${deviceStatusText}`;
        if (device.status === 'noncompliant') {
          ddDevice.className = 'status-warning';
        }
        dl.appendChild(dtDevice);
        dl.appendChild(ddDevice);

        // 세션
        const dtSession = document.createElement('dt');
        dtSession.textContent = '세션';
        const ddSession = document.createElement('dd');
        const sessionId = session.id || '확인 불가';
        const sessionStatusText = formatSessionStatus(session.status);
        ddSession.textContent = `${sessionId} · ${sessionStatusText}`;
        if (session.status === 'expired' || session.status === 'revoked') {
          ddSession.className = 'status-danger';
        }
        dl.appendChild(dtSession);
        dl.appendChild(ddSession);

        container.appendChild(dl);

        if (modeText) {
          const modeBadge = document.createElement('p');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }

        if (devices?.status === 'error' && devices.error?.message) {
          const devErr = document.createElement('p');
          devErr.className = 'student-error';
          devErr.textContent = `기기 목록 연결 실패: ${devices.error.message}`;
          container.appendChild(devErr);
        }
        if (sessions?.status === 'error' && sessions.error?.message) {
          const sessErr = document.createElement('p');
          sessErr.className = 'student-error';
          sessErr.textContent = `세션 목록 연결 실패: ${sessions.error.message}`;
          container.appendChild(sessErr);
        }

        return container;
      }

      // 기본/알 수 없는 상태인 경우
      const fallback = document.createElement('p');
      fallback.textContent = '확인 불가';
      container.appendChild(fallback);
      return container;
    },
    renderDecision(context = {}) {
      const { status = 'idle', mode, data, error, appId } = context || {};
      const container = document.createElement('div');
      container.className = 'student-decision-container';

      const modeText = getModeText(mode);

      // 1. 요청 전 (idle)
      if (status === 'idle') {
        const idleEl = document.createElement('p');
        idleEl.className = 'state state-empty';
        idleEl.textContent = '앱을 골라 접속을 요청하세요.';
        container.appendChild(idleEl);
        return container;
      }

      // 2. 요청 중 (loading)
      if (status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'state state-loading';
        loadingEl.textContent = '판정 확인 중...';
        container.appendChild(loadingEl);
        return container;
      }

      // 3. 요청 실패 (error) - 거부(deny) 판정이 아님을 명시
      if (status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'decision decision-failed';

        const titleEl = document.createElement('p');
        const errorMsg = error?.message ? `요청 실패: ${error.message}` : '요청 실패: 판정 요청 중 오류가 발생했습니다.';
        titleEl.textContent = errorMsg;
        errorBox.appendChild(titleEl);

        const noticeEl = document.createElement('p');
        noticeEl.className = 'muted';
        noticeEl.textContent = '서버 통신 또는 요청 처리 실패입니다. 정책 기준에 따른 접근 거부(deny) 판정이 아니며, 접속이 허용되지 않았습니다.';
        errorBox.appendChild(noticeEl);

        container.appendChild(errorBox);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 4. 판정 수신 (ok)
      if (status === 'ok') {
        const targetAppId = (data && data.appId) || appId || '확인 불가';
        const rawDecision = data && data.decision;
        const reason = (data && data.reason) || '판정 사유 없음';
        const checkedAt = (data && data.checkedAt) || '확인 시각 없음';

        let decisionLabel = '판정 확인 불가(unknown)';
        let decisionClass = 'decision-unknown';
        let decisionNote = '판정을 확인할 수 없습니다. 접속이 허용되지 않았습니다.';

        if (rawDecision === 'allow') {
          decisionLabel = '접근 허용(allow)';
          decisionClass = 'decision-allow';
          decisionNote = '정책상 접근이 허용되었습니다. (실제 앱 접속 성공을 보장하지는 않습니다.)';
        } else if (rawDecision === 'deny') {
          decisionLabel = '접근 거부(deny)';
          decisionClass = 'decision-deny';
          decisionNote = '정책 기준에 따라 접근이 거부되었습니다.';
        } else if (rawDecision === 'challenge') {
          decisionLabel = '추가 인증 또는 확인 필요(challenge)';
          decisionClass = 'decision-challenge';
          decisionNote = '추가 인증 또는 확인이 필요합니다. (이 앱이 확인 절차를 대신하지 않습니다.)';
        }

        const decisionBox = document.createElement('div');
        decisionBox.className = `decision ${decisionClass}`;

        const headEl = document.createElement('p');
        headEl.textContent = `${decisionLabel} · ${targetAppId}`;
        decisionBox.appendChild(headEl);

        const noteEl = document.createElement('p');
        noteEl.className = 'muted';
        noteEl.textContent = decisionNote;
        decisionBox.appendChild(noteEl);

        container.appendChild(decisionBox);

        // 상세 정보 (대상 앱, 판정 이유, 판정 시각)
        const dl = document.createElement('dl');
        dl.className = 'kv';

        const dtApp = document.createElement('dt');
        dtApp.textContent = '대상 앱';
        const ddApp = document.createElement('dd');
        ddApp.textContent = targetAppId;
        dl.appendChild(dtApp);
        dl.appendChild(ddApp);

        const dtReason = document.createElement('dt');
        dtReason.textContent = '판정 이유';
        const ddReason = document.createElement('dd');
        ddReason.textContent = reason;
        dl.appendChild(dtReason);
        dl.appendChild(ddReason);

        const dtTime = document.createElement('dt');
        dtTime.textContent = '판정 시각';
        const ddTime = document.createElement('dd');
        ddTime.textContent = checkedAt;
        dl.appendChild(dtTime);
        dl.appendChild(ddTime);

        container.appendChild(dl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }

        return container;
      }

      // 기본/알 수 없는 상태
      const fallback = document.createElement('p');
      fallback.className = 'state state-empty';
      fallback.textContent = '판정 확인 불가(unknown) · 판정 요청 대기 중 (접속이 허용되지 않았습니다)';
      container.appendChild(fallback);
      return container;
    },
    renderEvents(context = {}) {
      const { status = 'idle', mode, data, error } = context || {};
      const container = document.createElement('div');
      container.className = 'student-events-container';

      const modeText = getModeText(mode);

      // 1. 로딩 상태
      if (status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '기록을 불러오는 중...';
        container.appendChild(loadingEl);
        return container;
      }

      // 2. 오류 상태 (빈 목록과 명확히 구분)
      if (status === 'error') {
        const errorEl = document.createElement('p');
        errorEl.className = 'student-error';
        const errorMsg = error?.message ? `기록을 불러오지 못했습니다: ${error.message}` : '기록을 불러오지 못했습니다.';
        errorEl.textContent = errorMsg;
        container.appendChild(errorEl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 3. 계약 불일치 또는 미확인 상태 (이전 내용 제거 후 확인 불가 안내)
      if (status === 'CONTRACT_MISMATCH') {
        const fallback = document.createElement('p');
        fallback.className = 'student-error';
        fallback.textContent = '확인 불가 (계약 불일치)';
        container.appendChild(fallback);
        return container;
      }

      // 4. 정상 응답 (ok)
      if (status === 'ok') {
        const rawEvents = Array.isArray(data) ? data : [];

        // 빈 배열 처리 (실패 화면과 완전히 다르게 표시)
        if (rawEvents.length === 0) {
          const emptyEl = document.createElement('p');
          emptyEl.className = 'student-empty';
          emptyEl.textContent = '표시할 기록이 없습니다';
          container.appendChild(emptyEl);

          if (modeText) {
            const modeBadge = document.createElement('span');
            modeBadge.className = 'tag tag-demo';
            modeBadge.textContent = modeText;
            container.appendChild(modeBadge);
          }
          return container;
        }

        // 1) 원본 배열을 수정하지 않고 복사하여 at 기준 최신순 정렬
        const sortedEvents = [...rawEvents].sort((a, b) => {
          const timeA = a.at ? new Date(a.at).getTime() : 0;
          const timeB = b.at ? new Date(b.at).getTime() : 0;
          return timeB - timeA;
        });

        // 3) '기록 종류', '업무 앱', '접속 상태' 필터 생성
        const uniqueKinds = [...new Set(sortedEvents.map((e) => e.kind).filter(Boolean))];
        const uniqueApps = [...new Set(sortedEvents.map((e) => ((e.appId !== undefined && e.appId !== null) ? String(e.appId) : '')).filter((v) => v !== ''))];
        const uniqueAccess = [...new Set(sortedEvents.map((e) => e.state?.access).filter(Boolean))];

        const filterBar = document.createElement('div');
        filterBar.className = 'student-filter-bar';

        // 기록 종류 필터
        const kindGroup = document.createElement('div');
        kindGroup.className = 'student-filter-group';
        const kindLabel = document.createElement('label');
        kindLabel.textContent = '기록 종류';
        kindLabel.htmlFor = 'student-filter-kind';
        const kindSelect = document.createElement('select');
        kindSelect.id = 'student-filter-kind';
        kindSelect.setAttribute('aria-label', '기록 종류');

        const kindAllOpt = document.createElement('option');
        kindAllOpt.value = 'all';
        kindAllOpt.textContent = '전체';
        kindSelect.appendChild(kindAllOpt);

        uniqueKinds.forEach((k) => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = k === 'access' ? '접속(access)' : (k === 'xdr' ? 'XDR 경보(xdr)' : k);
          kindSelect.appendChild(opt);
        });
        kindGroup.appendChild(kindLabel);
        kindGroup.appendChild(kindSelect);
        filterBar.appendChild(kindGroup);

        // 업무 앱 필터
        const appGroup = document.createElement('div');
        appGroup.className = 'student-filter-group';
        const appLabel = document.createElement('label');
        appLabel.textContent = '업무 앱';
        appLabel.htmlFor = 'student-filter-app';
        const appSelect = document.createElement('select');
        appSelect.id = 'student-filter-app';
        appSelect.setAttribute('aria-label', '업무 앱');

        const appAllOpt = document.createElement('option');
        appAllOpt.value = 'all';
        appAllOpt.textContent = '전체';
        appSelect.appendChild(appAllOpt);

        uniqueApps.forEach((app) => {
          const opt = document.createElement('option');
          opt.value = app;
          opt.textContent = app;
          appSelect.appendChild(opt);
        });
        appGroup.appendChild(appLabel);
        appGroup.appendChild(appSelect);
        filterBar.appendChild(appGroup);

        // 접속 상태 필터
        const accessGroup = document.createElement('div');
        accessGroup.className = 'student-filter-group';
        const accessLabel = document.createElement('label');
        accessLabel.textContent = '접속 상태';
        accessLabel.htmlFor = 'student-filter-access';
        const accessSelect = document.createElement('select');
        accessSelect.id = 'student-filter-access';
        accessSelect.setAttribute('aria-label', '접속 상태');

        const accessAllOpt = document.createElement('option');
        accessAllOpt.value = 'all';
        accessAllOpt.textContent = '전체';
        accessSelect.appendChild(accessAllOpt);

        uniqueAccess.forEach((acc) => {
          const opt = document.createElement('option');
          opt.value = acc;
          const accLabel = acc === 'allowed' ? '허용(allowed)' : (acc === 'denied' ? '거부(denied)' : (acc === 'unknown' ? '확인 불가(unknown)' : acc));
          opt.textContent = accLabel;
          accessSelect.appendChild(opt);
        });
        accessGroup.appendChild(accessLabel);
        accessGroup.appendChild(accessSelect);
        filterBar.appendChild(accessGroup);

        container.appendChild(filterBar);

        // 4) 상세 영역 (data-student-event-detail)
        const detailContainer = document.createElement('div');
        detailContainer.className = 'student-event-detail';
        container.appendChild(detailContainer);

        function renderDetail(ev) {
          detailContainer.replaceChildren();
          if (!ev) {
            detailContainer.removeAttribute('data-student-event-detail');
            return;
          }

          detailContainer.setAttribute('data-student-event-detail', ev.id || '');

          const detailTitle = document.createElement('h3');
          detailTitle.textContent = `${ev.id} 상세`;
          detailContainer.appendChild(detailTitle);

          // 사건 ID 및 appId
          const metaDl = document.createElement('dl');
          metaDl.className = 'kv';

          const dtId = document.createElement('dt');
          dtId.textContent = '사건 ID';
          const ddId = document.createElement('dd');
          ddId.textContent = ev.id || '확인 불가';
          metaDl.appendChild(dtId);
          metaDl.appendChild(ddId);

          const dtApp = document.createElement('dt');
          dtApp.textContent = '업무 앱';
          const ddApp = document.createElement('dd');
          ddApp.textContent = ev.appId ? ev.appId : '앱 확인 불가 (없음)';
          metaDl.appendChild(dtApp);
          metaDl.appendChild(ddApp);

          detailContainer.appendChild(metaDl);

          // 상태 정보 (access·session·device 세 상태의 원래 값과 한국어 설명)
          const stateBox = document.createElement('div');
          stateBox.className = 'student-detail-state-box';

          const stateHeading = document.createElement('h4');
          stateHeading.textContent = '접속 및 보안 상태';
          stateBox.appendChild(stateHeading);

          const stateDl = document.createElement('dl');
          stateDl.className = 'kv';

          const dtAccess = document.createElement('dt');
          dtAccess.textContent = '접속 상태';
          const ddAccess = document.createElement('dd');
          ddAccess.textContent = formatStateDetail(ev.state?.access, ACCESS_STATUS_LABELS);
          stateDl.appendChild(dtAccess);
          stateDl.appendChild(ddAccess);

          const dtSession = document.createElement('dt');
          dtSession.textContent = '세션 상태';
          const ddSession = document.createElement('dd');
          ddSession.textContent = formatStateDetail(ev.state?.session, SESSION_STATUS_LABELS);
          stateDl.appendChild(dtSession);
          stateDl.appendChild(ddSession);

          const dtDevice = document.createElement('dt');
          dtDevice.textContent = '기기 상태';
          const ddDevice = document.createElement('dd');
          ddDevice.textContent = formatStateDetail(ev.state?.device, DEVICE_STATUS_LABELS);
          stateDl.appendChild(dtDevice);
          stateDl.appendChild(ddDevice);

          stateBox.appendChild(stateDl);
          detailContainer.appendChild(stateBox);

          // evidence (근거)
          const evidenceBox = document.createElement('div');
          evidenceBox.className = 'student-detail-evidence';
          const evidenceHeading = document.createElement('h4');
          evidenceHeading.textContent = '근거 (evidence)';
          evidenceBox.appendChild(evidenceHeading);

          const evList = Array.isArray(ev.evidence) ? ev.evidence : [];
          if (evList.length === 0) {
            const noEv = document.createElement('p');
            noEv.className = 'muted';
            noEv.textContent = '근거 없음';
            evidenceBox.appendChild(noEv);
          } else {
            const evUl = document.createElement('ul');
            evList.forEach((entry) => {
              const li = document.createElement('li');
              li.textContent = `${entry.id || ''}: ${entry.text || ''}`;
              evUl.appendChild(li);
            });
            evidenceBox.appendChild(evUl);
          }
          detailContainer.appendChild(evidenceBox);

          // rules (규칙)
          const rulesBox = document.createElement('div');
          rulesBox.className = 'student-detail-rules';
          const rulesHeading = document.createElement('h4');
          rulesHeading.textContent = '규칙 (rules)';
          rulesBox.appendChild(rulesHeading);

          const rulesList = Array.isArray(ev.rules) ? ev.rules : [];
          if (rulesList.length === 0) {
            const noRules = document.createElement('p');
            noRules.className = 'muted';
            noRules.textContent = '규칙 없음';
            rulesBox.appendChild(noRules);
          } else {
            const rulesUl = document.createElement('ul');
            rulesList.forEach((rule) => {
              const li = document.createElement('li');
              li.textContent = `${rule.id || ''}: ${rule.text || ''}`;
              rulesUl.appendChild(li);
            });
            rulesBox.appendChild(rulesUl);
          }
          detailContainer.appendChild(rulesBox);

          // 16단계: supportedActions가 비어 있으면 조치 버튼을 추가하지 않음
          const actions = Array.isArray(ev.supportedActions) ? ev.supportedActions : [];
          if (actions.length > 0) {
            const actionsBox = document.createElement('div');
            actionsBox.className = 'student-detail-actions';

            const actionsHeading = document.createElement('h4');
            actionsHeading.textContent = '조치 (actions)';
            actionsBox.appendChild(actionsHeading);

            const actionsNotice = document.createElement('p');
            actionsNotice.className = 'muted';
            actionsNotice.textContent = '조치 실행 연결은 준비 중입니다. 현재 이 조치를 지원하지 않습니다.';
            actionsBox.appendChild(actionsNotice);

            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'student-action-buttons';

            actions.forEach((act) => {
              const actBtn = document.createElement('button');
              actBtn.type = 'button';
              actBtn.className = 'btn btn-sm btn-disabled';
              actBtn.disabled = true;
              actBtn.textContent = `${act} 미지원`;
              actBtn.setAttribute('aria-label', `${act} 미지원`);
              buttonGroup.appendChild(actBtn);
            });

            actionsBox.appendChild(buttonGroup);
            detailContainer.appendChild(actionsBox);
          }
        }

        const listContainer = document.createElement('div');
        listContainer.className = 'student-events-list';
        container.appendChild(listContainer);

        let currentKindFilter = 'all';
        let currentAppFilter = 'all';
        let currentAccessFilter = 'all';
        let selectedEventId = null;

        function updateList() {
          listContainer.replaceChildren();

          const filtered = sortedEvents.filter((ev) => {
            if (currentKindFilter !== 'all' && ev.kind !== currentKindFilter) return false;
            if (currentAppFilter !== 'all') {
              const appVal = (ev.appId !== undefined && ev.appId !== null) ? String(ev.appId) : '';
              if (appVal !== currentAppFilter) return false;
            }
            if (currentAccessFilter !== 'all' && ev.state?.access !== currentAccessFilter) return false;
            return true;
          });

          if (filtered.length === 0) {
            const noResult = document.createElement('p');
            noResult.className = 'student-empty';
            noResult.textContent = '조건에 일치하는 기록이 없습니다.';
            listContainer.appendChild(noResult);
            return;
          }

          // 2) 각 행에 id·시각·종류(kind)·앱(appId)·요약(summary)을 표시하고 data-student-event-id 부여
          filtered.forEach((ev) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'student-event-item';
            itemEl.setAttribute('data-student-event-id', ev.id || '');

            const headEl = document.createElement('div');
            headEl.className = 'student-event-header';

            const idEl = document.createElement('strong');
            idEl.className = 'student-event-id';
            idEl.textContent = `사건 ID: ${ev.id || '확인 불가'}`;
            headEl.appendChild(idEl);

            const kindText = ev.kind === 'access' ? '접속' : (ev.kind === 'xdr' ? 'XDR 경보' : (ev.kind || '확인 불가'));
            const kindEl = document.createElement('span');
            kindEl.className = 'student-event-kind';
            kindEl.textContent = `종류: ${kindText} (${ev.kind || 'unknown'})`;
            headEl.appendChild(kindEl);

            const timeText = ev.at ? `${ev.at} (${new Date(ev.at).toLocaleString('ko-KR')})` : '시각 확인 불가';
            const timeEl = document.createElement('span');
            timeEl.className = 'student-event-time';
            timeEl.textContent = `시각: ${timeText}`;
            headEl.appendChild(timeEl);

            const appText = ev.appId ? ev.appId : '앱 확인 불가 (없음)';
            const appEl = document.createElement('span');
            appEl.className = 'student-event-app';
            appEl.textContent = `앱: ${appText}`;
            headEl.appendChild(appEl);

            itemEl.appendChild(headEl);

            const summaryEl = document.createElement('p');
            summaryEl.className = 'student-event-summary';
            summaryEl.textContent = `요약: ${ev.summary || '요약 없음'}`;
            itemEl.appendChild(summaryEl);

            // 4) '<event.id> 상세' 버튼
            const detailBtn = document.createElement('button');
            detailBtn.type = 'button';
            detailBtn.className = 'btn btn-sm student-detail-btn';
            detailBtn.textContent = `${ev.id} 상세`;
            detailBtn.setAttribute('aria-label', `${ev.id} 상세`);
            detailBtn.addEventListener('click', () => {
              if (selectedEventId === ev.id) {
                selectedEventId = null;
                renderDetail(null);
              } else {
                selectedEventId = ev.id;
                renderDetail(ev);
              }
            });
            itemEl.appendChild(detailBtn);

            listContainer.appendChild(itemEl);
          });
        }

        kindSelect.addEventListener('change', (e) => {
          currentKindFilter = e.target.value;
          updateList();
        });

        appSelect.addEventListener('change', (e) => {
          currentAppFilter = e.target.value;
          updateList();
        });

        accessSelect.addEventListener('change', (e) => {
          currentAccessFilter = e.target.value;
          updateList();
        });

        // 최초 목록 렌더링
        updateList();

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }

        return container;
      }

      // 기본 미확인 상태
      const fallback = document.createElement('p');
      fallback.textContent = '확인 불가';
      container.appendChild(fallback);
      return container;
    },
    renderStatus(context = {}) {
      const { devices, sessions, notifications, diagnostics, mode } = context || {};
      const container = document.createElement('div');
      container.className = 'student-status-container';

      const modeText = getModeText(mode);

      // --- 1. 기기 목록 (devices) ---
      const devicesSection = document.createElement('section');
      devicesSection.className = 'student-status-section';
      const devicesTitle = document.createElement('h3');
      devicesTitle.textContent = '기기 상태';
      devicesSection.appendChild(devicesTitle);

      if (devices?.status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '기기 목록을 불러오는 중입니다...';
        devicesSection.appendChild(loadingEl);
      } else if (devices?.status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'student-error-box';

        const errorMsg = document.createElement('p');
        errorMsg.className = 'student-error';
        errorMsg.textContent = `기기 목록을 불러오지 못했습니다: ${devices.error?.message || '알 수 없는 오류'}`;
        errorBox.appendChild(errorMsg);

        const isTimeout = devices.error?.code === 'ENGINE_TIMEOUT' ||
          devices.error?.code === 'REQUEST_TIMEOUT' ||
          (typeof devices.error?.message === 'string' && (devices.error.message.includes('초과') || devices.error.message.toLowerCase().includes('timeout')));
        if (isTimeout) {
          const timeoutMsg = document.createElement('p');
          timeoutMsg.className = 'status-warning';
          timeoutMsg.textContent = '요청 처리 시간이 초과되었습니다.';
          errorBox.appendChild(timeoutMsg);
        }

        const retryNotice = document.createElement('p');
        retryNotice.className = 'muted';
        retryNotice.textContent = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        errorBox.appendChild(retryNotice);

        devicesSection.appendChild(errorBox);
      } else if (devices?.status === 'ok') {
        const devList = Array.isArray(devices.data) ? devices.data : [];
        if (devList.length === 0) {
          const emptyEl = document.createElement('p');
          emptyEl.className = 'student-empty';
          emptyEl.textContent = '등록된 기기가 없음';
          devicesSection.appendChild(emptyEl);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'student-device-list';
          devList.forEach((dev) => {
            const li = document.createElement('li');
            const label = dev.label || dev.id || '확인 불가';
            const statusLabel = formatDeviceStatus(dev.status);
            li.textContent = `${label} · ${statusLabel}(${dev.status || 'unknown'})`;
            ul.appendChild(li);
          });
          devicesSection.appendChild(ul);
        }
      } else {
        const fallback = document.createElement('p');
        fallback.className = 'muted';
        fallback.textContent = '확인 불가';
        devicesSection.appendChild(fallback);
      }
      container.appendChild(devicesSection);

      // --- 2. 세션 정보 (sessions) ---
      const sessionsSection = document.createElement('section');
      sessionsSection.className = 'student-status-section';
      const sessionsTitle = document.createElement('h3');
      sessionsTitle.textContent = '세션 상태';
      sessionsSection.appendChild(sessionsTitle);

      const sessionNotice = document.createElement('p');
      sessionNotice.className = 'muted';
      sessionNotice.textContent = '세션 조회는 현재 검증된 연결 한 개를 대상으로 하며 과거 세션 전체 목록이 아닙니다.';
      sessionsSection.appendChild(sessionNotice);

      if (sessions?.status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '세션 정보를 불러오는 중입니다...';
        sessionsSection.appendChild(loadingEl);
      } else if (sessions?.status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'student-error-box';

        const errorMsg = document.createElement('p');
        errorMsg.className = 'student-error';
        errorMsg.textContent = `세션 정보를 불러오지 못했습니다: ${sessions.error?.message || '알 수 없는 오류'}`;
        errorBox.appendChild(errorMsg);

        const isTimeout = sessions.error?.code === 'ENGINE_TIMEOUT' ||
          sessions.error?.code === 'REQUEST_TIMEOUT' ||
          (typeof sessions.error?.message === 'string' && (sessions.error.message.includes('초과') || sessions.error.message.toLowerCase().includes('timeout')));
        if (isTimeout) {
          const timeoutMsg = document.createElement('p');
          timeoutMsg.className = 'status-warning';
          timeoutMsg.textContent = '요청 처리 시간이 초과되었습니다.';
          errorBox.appendChild(timeoutMsg);
        }

        const retryNotice = document.createElement('p');
        retryNotice.className = 'muted';
        retryNotice.textContent = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        errorBox.appendChild(retryNotice);

        sessionsSection.appendChild(errorBox);
      } else if (sessions?.status === 'ok') {
        const sessList = Array.isArray(sessions.data) ? sessions.data : [];
        if (sessList.length === 0) {
          const emptyEl = document.createElement('p');
          emptyEl.className = 'student-empty';
          emptyEl.textContent = '현재 연결 없음';
          sessionsSection.appendChild(emptyEl);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'student-session-list';
          sessList.forEach((sess) => {
            const li = document.createElement('li');
            const idText = sess.id || '확인 불가';
            const statusLabel = formatSessionStatus(sess.status);
            li.textContent = `${idText} · ${statusLabel}(${sess.status || 'unknown'})`;
            ul.appendChild(li);
          });
          sessionsSection.appendChild(ul);
        }
      } else {
        const fallback = document.createElement('p');
        fallback.className = 'muted';
        fallback.textContent = '확인 불가';
        sessionsSection.appendChild(fallback);
      }
      container.appendChild(sessionsSection);

      // --- 3. 알림 (notifications) ---
      const notiSection = document.createElement('section');
      notiSection.className = 'student-status-section';
      const notiTitle = document.createElement('h3');
      notiTitle.textContent = '알림';
      notiSection.appendChild(notiTitle);

      const notiList = Array.isArray(notifications) ? notifications : [];
      if (notiList.length === 0) {
        const emptyNoti = document.createElement('p');
        emptyNoti.className = 'student-empty';
        emptyNoti.textContent = '주의할 알림이 없습니다.';
        notiSection.appendChild(emptyNoti);
      } else {
        const notiUl = document.createElement('ul');
        notiUl.className = 'student-notification-list';
        notiList.forEach((n) => {
          const li = document.createElement('li');
          const resource = n.resource || '확인 불가';
          const code = n.code || 'UNVERIFIED';
          const message = n.message || '알림 내용 없음';
          li.textContent = `${resource} · [${code}] ${message}`;
          notiUl.appendChild(li);
        });
        notiSection.appendChild(notiUl);
      }
      container.appendChild(notiSection);

      // --- 4. 진단 정보 (diagnostics) ---
      const diagSection = document.createElement('section');
      diagSection.className = 'student-status-section';
      const diagTitle = document.createElement('h3');
      diagTitle.textContent = '진단 정보';
      diagSection.appendChild(diagTitle);

      if (diagnostics?.status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '진단 정보를 불러오는 중입니다...';
        diagSection.appendChild(loadingEl);
      } else if (diagnostics?.status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'student-error-box';

        const errorMsg = document.createElement('p');
        errorMsg.className = 'student-error';
        errorMsg.textContent = `진단 정보를 불러오지 못했습니다: ${diagnostics.error?.message || '알 수 없는 오류'}`;
        errorBox.appendChild(errorMsg);

        const retryNotice = document.createElement('p');
        retryNotice.className = 'muted';
        retryNotice.textContent = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        errorBox.appendChild(retryNotice);

        diagSection.appendChild(errorBox);
      } else if (diagnostics?.status === 'ok') {
        const diagData = diagnostics.data || {};
        const safeDiagnostics = {
          requestId: diagData.requestId || '확인 불가',
          component: diagData.component || '확인 불가',
          version: diagData.version || '확인 불가',
          checkedAt: diagData.checkedAt || '확인 불가',
          engineMode: diagData.engine?.mode || '확인 불가',
          engineCode: diagData.engine?.code || '확인 불가',
        };

        const dl = document.createElement('dl');
        dl.className = 'kv';

        const dtReq = document.createElement('dt');
        dtReq.textContent = 'requestId';
        const ddReq = document.createElement('dd');
        ddReq.textContent = safeDiagnostics.requestId;
        dl.appendChild(dtReq);
        dl.appendChild(ddReq);

        const dtComp = document.createElement('dt');
        dtComp.textContent = 'component';
        const ddComp = document.createElement('dd');
        ddComp.textContent = safeDiagnostics.component;
        dl.appendChild(dtComp);
        dl.appendChild(ddComp);

        const dtVer = document.createElement('dt');
        dtVer.textContent = 'version';
        const ddVer = document.createElement('dd');
        ddVer.textContent = safeDiagnostics.version;
        dl.appendChild(dtVer);
        dl.appendChild(ddVer);

        const dtTime = document.createElement('dt');
        dtTime.textContent = 'checkedAt';
        const ddTime = document.createElement('dd');
        ddTime.textContent = safeDiagnostics.checkedAt;
        dl.appendChild(dtTime);
        dl.appendChild(ddTime);

        const dtEngMode = document.createElement('dt');
        dtEngMode.textContent = 'engine.mode';
        const ddEngMode = document.createElement('dd');
        ddEngMode.textContent = safeDiagnostics.engineMode;
        dl.appendChild(dtEngMode);
        dl.appendChild(ddEngMode);

        const dtEngCode = document.createElement('dt');
        dtEngCode.textContent = 'engine.code';
        const ddEngCode = document.createElement('dd');
        ddEngCode.textContent = safeDiagnostics.engineCode;
        dl.appendChild(dtEngCode);
        dl.appendChild(ddEngCode);

        diagSection.appendChild(dl);

        const copyNotice = document.createElement('p');
        copyNotice.className = 'muted';
        copyNotice.textContent = '이 정보는 문제 해결 및 도움 요청에 사용하도록 복사하는 진단 정보입니다.';
        diagSection.appendChild(copyNotice);

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'btn btn-sm';
        copyBtn.textContent = '도움정보 복사';
        copyBtn.setAttribute('aria-label', '도움정보 복사');

        const copyResultMsg = document.createElement('span');
        copyResultMsg.className = 'copy-result muted';
        copyResultMsg.style.marginLeft = '8px';

        copyBtn.addEventListener('click', async () => {
          try {
            const textToCopy = JSON.stringify({
              requestId: safeDiagnostics.requestId,
              component: safeDiagnostics.component,
              version: safeDiagnostics.version,
              checkedAt: safeDiagnostics.checkedAt,
              engine: {
                mode: safeDiagnostics.engineMode,
                code: safeDiagnostics.engineCode,
              },
            }, null, 2);
            await navigator.clipboard.writeText(textToCopy);
            copyResultMsg.textContent = '도움정보가 클립보드에 복사되었습니다.';
          } catch {
            copyResultMsg.textContent = '복사에 실패했습니다.';
          }
        });

        diagSection.appendChild(copyBtn);
        diagSection.appendChild(copyResultMsg);
      } else {
        const diagNotice = document.createElement('p');
        diagNotice.className = 'muted';
        diagNotice.textContent = '진단 정보가 아직 조회되지 않았습니다. 제공 화면의 점검 기능을 사용하세요.';
        diagSection.appendChild(diagNotice);
      }
      container.appendChild(diagSection);

      if (modeText) {
        const modeBadge = document.createElement('span');
        modeBadge.className = 'tag tag-demo';
        modeBadge.textContent = modeText;
        container.appendChild(modeBadge);
      }

      return container;
    },
    renderVulnerabilities(context = {}) {
      const { status = 'idle', mode, data, error } = context || {};
      const container = document.createElement('div');
      container.className = 'student-vulnerabilities-container';

      const modeText = getModeText(mode);

      // 1. 조회 전 (idle)
      if (status === 'idle') {
        const idleEl = document.createElement('p');
        idleEl.className = 'state state-empty';
        idleEl.textContent = '조회 전';
        container.appendChild(idleEl);

        const idleNotice = document.createElement('p');
        idleNotice.className = 'muted';
        idleNotice.textContent = '프로젝트에 설치된 패키지의 알려진 취약점을 확인하려면 제공 화면의 조회 버튼을 직접 누르세요.';
        container.appendChild(idleNotice);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 2. 조회 중 (loading)
      if (status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'state state-loading';
        loadingEl.textContent = '조회 중';
        container.appendChild(loadingEl);

        const loadingNotice = document.createElement('p');
        loadingNotice.className = 'muted';
        loadingNotice.textContent = '설치된 패키지 메타데이터와 OSV 취약점 정보를 대조하는 중입니다. 이전 결과는 유지되지 않습니다.';
        container.appendChild(loadingNotice);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 3. 조회 실패 (error)
      if (status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'student-error-box';

        const code = error?.code || 'UNVERIFIED';
        const msg = error?.message || '패키지 취약점 조회 중 오류가 발생했습니다.';

        const errorTitle = document.createElement('p');
        errorTitle.className = 'student-error';
        errorTitle.textContent = `조회 실패: [${code}] ${msg}`;
        errorBox.appendChild(errorTitle);

        const errorNotice = document.createElement('p');
        errorNotice.className = 'muted';
        errorNotice.textContent = '조회가 실패하여 현재 취약점 여부를 확인할 수 없습니다. (조회 실패는 취약점 없음이 아닙니다. 이전 표는 남기지 않습니다.)';
        errorBox.appendChild(errorNotice);

        container.appendChild(errorBox);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 4. 정상 조회 응답 (ok)
      if (status === 'ok') {
        const scanData = data || {};
        const scanStatus = scanData.status || 'unverifiable';

        // 전체 조회 상태 라벨 매핑
        const SCAN_STATUS_MAP = {
          complete: '모두 조회(complete)',
          partial: '일부 조회 실패(partial)',
          not_checked: '아직 조회 안 함(not_checked)',
          not_configured: '조회 준비 미완료(not_configured)',
          unverifiable: 'lock 파일 확인 불가(unverifiable)',
        };
        const scanStatusText = SCAN_STATUS_MAP[scanStatus] || `${scanStatus}(unknown)`;

        const headerBox = document.createElement('div');
        headerBox.className = 'student-vulnerabilities-header';

        const statusHeading = document.createElement('h3');
        statusHeading.textContent = `전체 조회 상태: ${scanStatusText}`;
        headerBox.appendChild(statusHeading);

        // 상태별 부가 설명
        const statusDesc = document.createElement('p');
        statusDesc.className = 'student-vulnerabilities-desc muted';
        if (scanStatus === 'not_configured') {
          statusDesc.textContent = '조회 준비 미완료: 대상 프로젝트 설정이 필요합니다. 대상 경로나 허용 패키지 설정이 비어 있는 상태입니다.';
        } else if (scanStatus === 'not_checked') {
          statusDesc.textContent = '아직 조회 안 함: 승인된 공개 조회 대상이 없거나 조회를 시작하지 않았습니다. (취약점 없음이 아닙니다.)';
        } else if (scanStatus === 'unverifiable') {
          statusDesc.textContent = 'lock 파일 확인 불가: package-lock.json 또는 설치 메타데이터를 확인할 수 없습니다. (취약점 없음이 아닙니다.)';
        } else if (scanStatus === 'partial') {
          statusDesc.textContent = '일부 조회 실패: 일부 패키지의 OSV 조회가 실패했습니다. 이미 수신된 결과만 보존하여 표시합니다.';
        } else if (scanStatus === 'complete') {
          statusDesc.textContent = '모두 조회 완료: 허용된 모든 대상 패키지의 조회가 완료되었습니다.';
        }
        headerBox.appendChild(statusDesc);

        // lockfile 메타데이터 요약 (lockfileVersion, lockfileHash, checkedAt)
        const metaDl = document.createElement('dl');
        metaDl.className = 'kv student-vulnerabilities-meta';

        if (scanData.lockfileVersion !== undefined && scanData.lockfileVersion !== null) {
          const dtVer = document.createElement('dt');
          dtVer.textContent = 'lockfileVersion';
          const ddVer = document.createElement('dd');
          ddVer.textContent = String(scanData.lockfileVersion);
          metaDl.appendChild(dtVer);
          metaDl.appendChild(ddVer);
        }

        if (scanData.lockfileHash) {
          const dtHash = document.createElement('dt');
          dtHash.textContent = 'lockfileHash';
          const ddHash = document.createElement('dd');
          ddHash.textContent = scanData.lockfileHash;
          metaDl.appendChild(dtHash);
          metaDl.appendChild(ddHash);
        }

        if (scanData.checkedAt) {
          const dtChecked = document.createElement('dt');
          dtChecked.textContent = 'checkedAt';
          const ddChecked = document.createElement('dd');
          ddChecked.textContent = scanData.checkedAt;
          metaDl.appendChild(dtChecked);
          metaDl.appendChild(ddChecked);
        }

        if (metaDl.children.length > 0) {
          headerBox.appendChild(metaDl);
        }
        container.appendChild(headerBox);

        // 패키지 목록 테이블/카드 구성
        const pkgList = Array.isArray(scanData.packages) ? scanData.packages : [];
        const tableContainer = document.createElement('div');
        tableContainer.className = 'student-vulnerabilities-table-wrap';

        if (pkgList.length === 0) {
          const emptyNotice = document.createElement('p');
          emptyNotice.className = 'student-empty';
          if (scanStatus === 'not_configured' || scanStatus === 'unverifiable' || scanStatus === 'not_checked') {
            emptyNotice.textContent = `표시할 패키지 정보가 없습니다. (현재 상태: ${scanStatusText})`;
          } else {
            emptyNotice.textContent = '조회된 패키지 목록이 없습니다.';
          }
          tableContainer.appendChild(emptyNotice);
        } else {
          const table = document.createElement('table');
          table.className = 'student-vulnerabilities-table';

          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          ['패키지명', '정확한 설치 버전', '상태', '출처(source)', '조회 시각', '취약점 항목(OSV)'].forEach((colText) => {
            const th = document.createElement('th');
            th.textContent = colText;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);

          const tbody = document.createElement('tbody');

          pkgList.forEach((pkg) => {
            const tr = document.createElement('tr');
            // 행 필수 속성: data-student-package-name, data-student-package-version
            const pkgName = pkg.name || '확인 불가';
            const pkgVersion = pkg.version || '확인 불가';
            tr.setAttribute('data-student-package-name', pkgName);
            tr.setAttribute('data-student-package-version', pkgVersion);

            // 1) 패키지명
            const tdName = document.createElement('td');
            tdName.textContent = pkgName;
            tr.appendChild(tdName);

            // 2) 설치된 정확한 버전 (^ 범위 아님)
            const tdVer = document.createElement('td');
            tdVer.textContent = pkgVersion;
            tr.appendChild(tdVer);

            // 3) 패키지 상태
            const tdStatus = document.createElement('td');
            const pStatus = pkg.status || 'unverifiable';
            const hasVulns = Array.isArray(pkg.vulnerabilities) && pkg.vulnerabilities.length > 0;

            if (pStatus === 'known_vulnerabilities') {
              tdStatus.textContent = '알려진 항목 있음(known_vulnerabilities)';
              tdStatus.className = 'status-danger';
            } else if (pStatus === 'none_found') {
              tdStatus.textContent = '알려진 항목 없음(none_found)';
              tdStatus.className = 'status-success';
            } else if (pStatus === 'unverifiable') {
              if (hasVulns) {
                tdStatus.textContent = '일부 확인·전체 조회 확인 불가(unverifiable)';
                tdStatus.className = 'status-warning';
              } else {
                tdStatus.textContent = '조회 확인 불가(unverifiable)';
                tdStatus.className = 'status-warning';
              }
            } else {
              tdStatus.textContent = `${pStatus}(unknown)`;
            }
            tr.appendChild(tdStatus);

            // 4) 출처 (source)
            const tdSource = document.createElement('td');
            tdSource.textContent = pkg.source || '확인 불가';
            tr.appendChild(tdSource);

            // 5) 조회 시각 (checkedAt)
            const tdTime = document.createElement('td');
            tdTime.textContent = pkg.checkedAt || '확인 불가';
            tr.appendChild(tdTime);

            // 6) 취약점 항목 (id, modified)
            const tdVulns = document.createElement('td');
            if (hasVulns) {
              const vulnUl = document.createElement('ul');
              vulnUl.className = 'student-vuln-list';
              pkg.vulnerabilities.forEach((v) => {
                const li = document.createElement('li');
                const vId = v.id || 'ID 없음';
                const vMod = v.modified ? ` (수정 시각: ${v.modified})` : '';
                li.textContent = `${vId}${vMod}`;
                vulnUl.appendChild(li);
              });
              tdVulns.appendChild(vulnUl);
            } else {
              const noVulnText = document.createElement('span');
              noVulnText.className = 'muted';
              if (pStatus === 'none_found') {
                noVulnText.textContent = '조회 범위에서 알려진 취약점 없음 (OSV DB 기준)';
              } else if (pStatus === 'unverifiable') {
                noVulnText.textContent = '취약점 여부 확인 불가 (조회 실패/미완료)';
              } else {
                noVulnText.textContent = '취약점 항목 없음';
              }
              tdVulns.appendChild(noVulnText);
            }
            tr.appendChild(tdVulns);

            tbody.appendChild(tr);
          });

          table.appendChild(tbody);
          tableContainer.appendChild(table);
        }

        container.appendChild(tableContainer);

        // OSV 한계 안내 고지
        const disclaimer = document.createElement('p');
        disclaimer.className = 'muted';
        disclaimer.textContent = '안내: OSV는 알려진 취약점 데이터베이스입니다. none_found(알려진 항목 없음)는 공개 DB 조회 범위 내에 알려진 취약점이 없다는 뜻이며, 해당 패키지나 시스템 전체의 무결성 또는 완벽한 안전성을 보장하는 것은 아닙니다.';
        container.appendChild(disclaimer);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }

        return container;
      }

      // fallback
      const fallback = document.createElement('p');
      fallback.className = 'muted';
      fallback.textContent = '확인 불가';
      container.appendChild(fallback);
      return container;
    },
    renderAiConnection(context = {}) {
      const { status = 'idle', mode, data, error, checkedAt, explanationAccepted } = context || {};
      const container = document.createElement('div');
      container.className = 'student-ai-connection-container';

      const modeText = getModeText(mode);

      // 1. 점검 전 (idle)
      if (status === 'idle') {
        const idleEl = document.createElement('p');
        idleEl.className = 'state state-empty';
        idleEl.textContent = 'AI 연결 점검 전';
        container.appendChild(idleEl);

        const idleNotice = document.createElement('p');
        idleNotice.className = 'muted';
        idleNotice.textContent = 'AI 연결 상태를 확인하려면 위쪽 AI 연결 영역의 「현재 API 연결 점검」 버튼을 직접 누르세요.';
        container.appendChild(idleNotice);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 2. 점검 중 (loading)
      if (status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'state state-loading';
        loadingEl.textContent = 'AI 연결 점검 중';
        container.appendChild(loadingEl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 3. 점검 오류 (error)
      if (status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'student-error-box';

        const code = error?.code || 'UNVERIFIED';
        const message = error?.message || 'AI 연결 점검 중 오류가 발생했습니다.';

        const errorTitle = document.createElement('p');
        errorTitle.className = 'student-error';
        errorTitle.textContent = `AI 연결 점검 실패 [${code}]: ${message}`;
        errorBox.appendChild(errorTitle);

        const guideEl = document.createElement('p');
        guideEl.className = 'student-error-guide';

        if (code === 'ON_AI_PROVISIONING_PENDING' || code === 'ON_AI_AUTHORIZATION_CHANGED' || code === 'SUBJECT_SCOPE_UNVERIFIED') {
          guideEl.textContent = '권한 안내: 학생 앱의 현재 계정 연결과 앱 전용 AI 이용 권한을 담당자에게 확인하세요. (학생 계정 권한 준비 중이며 학생 잘못이 아닙니다.)';
        } else if (code === 'WB_CLCO_AUTH_REQUIRED') {
          guideEl.textContent = '인증 안내: 계정 연결을 다시 확인하세요. 앱 전용 열쇠를 확인하고 필요한 경우 담당자에게 확인을 요청하세요. (Workbench 열쇠를 복사해 붙이지 마세요.)';
        } else if (code === 'WB_CLCO_ACCESS_BLOCKED') {
          guideEl.textContent = '접근 제한 안내: 학생 앱의 이용 권한이 차단되었거나 제한되었습니다. 계정 연결 상태를 확인하고 담당자에게 문의하세요.';
        } else if (code === 'WB_CLCO_COHORT_BUDGET_EXHAUSTED' || code === 'WB_CLCO_LIMIT_REACHED') {
          guideEl.textContent = '사용량·한도 안내: 반의 AI 사용량이 소진되었거나 이용 한도에 도달했습니다. 담당자에게 확인을 요청하세요.';
        } else if (code === 'WB_CLCO_SESSION_CLOSED') {
          guideEl.textContent = '이용 시간 안내: 현재 AI 이용 시간이 아닙니다. 수업 및 실습 가능 시간을 확인하세요.';
        } else if (code === 'WB_CLCO_RATE_LIMITED' || code === 'WB_CLCO_TIMEOUT' || code === 'REQUEST_TIMEOUT' || code === 'ENGINE_TIMEOUT' || code === 'TIMEOUT' || code === 'WB_CLCO_NETWORK_ERROR' || code === 'WB_CLCO_SERVER_UNAVAILABLE') {
          guideEl.textContent = '요청 제한·시간 초과·네트워크 안내: 요청이 일시적으로 지연되었거나 제한되었습니다. 잠시 후 위쪽 버튼을 직접 눌러 다시 점검하세요. (자동으로 다시 요청하지 않습니다.)';
        } else if (code === 'WB_CLCO_CANCELLED' || code === 'CANCELLED' || code === 'REQUEST_CANCELLED') {
          guideEl.textContent = '취소 안내: AI 연결 점검 요청이 취소되었습니다. 이전 응답은 현재 결과가 아닙니다.';
        } else if (code === 'MODEL_NOT_CONFIGURED' || code === 'ON_AI_MODEL_LIST_EMPTY') {
          guideEl.textContent = '모델 안내: 현재 앱 권한으로 사용할 수 있는 허용된 AI 모델이 없습니다. 담당자에게 모델 설정을 확인하세요.';
        } else {
          guideEl.textContent = '상태 안내: 연결 점검 결과를 확인하세요. 필요하면 담당자에게 확인을 요청하세요.';
        }
        errorBox.appendChild(guideEl);

        const retryNotice = document.createElement('p');
        retryNotice.className = 'muted';
        retryNotice.textContent = '다시 점검하려면 위쪽 AI 연결 영역의 「현재 API 연결 점검」 버튼을 직접 누르세요. (자동으로 재점검하지 않습니다.)';
        errorBox.appendChild(retryNotice);

        container.appendChild(errorBox);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 4. 점검 완료 (ok)
      if (status === 'ok') {
        const okBox = document.createElement('div');
        okBox.className = 'student-ai-connection-ok';

        const audienceAuth = data?.audienceAuthorization;
        let authLabel = '확인 불가(unknown)';
        if (audienceAuth === 'test') {
          authLabel = '시험 연결 점검(test)';
        } else if (audienceAuth === 'verified') {
          authLabel = '앱 권한 확인 후 점검(verified)';
        }

        const authEl = document.createElement('p');
        authEl.className = 'student-ai-auth';
        authEl.textContent = `연결 상태: ${authLabel}`;
        okBox.appendChild(authEl);

        const countVal = (data?.modelCount !== undefined && data?.modelCount !== null) ? data.modelCount : '확인 불가';
        const modelCountEl = document.createElement('p');
        modelCountEl.className = 'student-ai-models';
        modelCountEl.textContent = `사용 가능 모델 수: ${countVal}`;
        okBox.appendChild(modelCountEl);

        const timeVal = checkedAt || data?.checkedAt || '확인 시각 없음';
        const checkedAtEl = document.createElement('p');
        checkedAtEl.className = 'student-ai-time muted';
        checkedAtEl.textContent = `점검 시각: ${timeVal}`;
        okBox.appendChild(checkedAtEl);

        // 중요: 사건 설명 미실행 안내 (사건 설명 성공으로 호도하지 않음)
        const separationNotice = document.createElement('p');
        separationNotice.className = 'student-ai-notice status-warning';
        separationNotice.textContent = '사건 설명은 아직 실행하지 않았습니다. (이 결과는 AI 연결 및 사용 가능한 모델 목록만 점검한 것이며, 실제 사건 설명은 보안 기록 목록에서 개별 사건을 선택해 별도로 요청해야 합니다.)';
        okBox.appendChild(separationNotice);

        container.appendChild(okBox);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 기본/확인 불가
      const fallback = document.createElement('p');
      fallback.className = 'muted';
      fallback.textContent = '확인 불가';
      container.appendChild(fallback);
      return container;
    },
    renderExplanation(context = {}) {
      const { event, explanation, checkedAt } = context || {};
      const container = document.createElement('div');
      container.className = 'student-explanation-container';

      // 1. explanation.status가 error인 경우 (event가 null이어도 오류와 실패 사유를 먼저 표시)
      if (explanation?.status === 'error') {
        container.removeAttribute('data-student-explanation-event');

        const errorBox = document.createElement('div');
        errorBox.className = 'student-error-box';

        const code = explanation.error?.code || 'UNVERIFIED';
        const message = explanation.error?.message || 'AI 설명을 불러오지 못했습니다.';

        const errorEl = document.createElement('p');
        errorEl.className = 'student-error';
        errorEl.textContent = `AI 설명 실패: [${code}] ${message}`;
        errorBox.appendChild(errorEl);

        // 이미 실행했다고 답한 설명 또는 잘못된 출력 처리 안내
        if (code === 'ON_AI_INVALID_OUTPUT') {
          const badOutputNotice = document.createElement('p');
          badOutputNotice.className = 'status-warning';
          badOutputNotice.textContent = 'AI가 이미 실행했다고 답했거나 근거 형식이 맞지 않는 설명은 수용할 수 없습니다.';
          errorBox.appendChild(badOutputNotice);
        } else if (code === 'ON_AI_INVALID_INPUT') {
          const badInputNotice = document.createElement('p');
          badInputNotice.className = 'status-warning';
          badInputNotice.textContent = '사건의 근거 또는 현재 상태가 올바르지 않아 설명 요청이 거절되었습니다.';
          errorBox.appendChild(badInputNotice);
        }

        const recordNotice = document.createElement('p');
        recordNotice.className = 'muted';
        recordNotice.textContent = 'AI 설명 요청이 실패했으나 기존 보안 기록은 그대로 유지됩니다. 과제 실패가 아닙니다.';
        errorBox.appendChild(recordNotice);

        container.appendChild(errorBox);
        return container;
      }

      // 2. 오류 없이 event가 null이거나 선택 전인 경우
      if (!event) {
        container.removeAttribute('data-student-explanation-event');
        const emptyEl = document.createElement('p');
        emptyEl.className = 'state state-empty';
        emptyEl.textContent = '보안 기록에서 기록을 먼저 고르세요.';
        container.appendChild(emptyEl);
        return container;
      }

      // 3. explanation이 아직 없거나 idle 상태인 경우
      if (!explanation || explanation.status === 'idle') {
        container.removeAttribute('data-student-explanation-event');
        const idleEl = document.createElement('p');
        idleEl.className = 'state state-empty';
        idleEl.textContent = `사건 ${event.id || '확인 불가'}가 선택되었습니다. AI 설명을 요청하세요.`;
        container.appendChild(idleEl);
        return container;
      }

      // 4. loading 상태인 경우
      if (explanation.status === 'loading') {
        container.removeAttribute('data-student-explanation-event');
        const loadingEl = document.createElement('p');
        loadingEl.className = 'state state-loading';
        loadingEl.textContent = '설명 요청 중입니다...';
        container.appendChild(loadingEl);
        return container;
      }

      // 5. ok 상태인 경우
      if (explanation.status === 'ok') {
        const data = explanation.data || {};
        const eventEvidenceList = Array.isArray(event.evidence) ? event.evidence : [];
        const evidenceMap = new Map(eventEvidenceList.map((e) => [e.id, e.text]));

        // 근거 대조 및 검증: explanation.data.evidenceIds 확인
        const evidenceIds = Array.isArray(data.evidenceIds) ? data.evidenceIds : [];
        const hasMissingEvidence = evidenceIds.length === 0 || evidenceIds.some((id) => !evidenceMap.has(id));

        // 이미 실행되었다고 잘못 표기된 경우(executed: true) 검증
        const isExecutedInvalid = data.executed === true;

        if (hasMissingEvidence || isExecutedInvalid) {
          container.removeAttribute('data-student-explanation-event');

          const rejectBox = document.createElement('div');
          rejectBox.className = 'student-error-box';

          const rejectTitle = document.createElement('p');
          rejectTitle.className = 'student-error';
          rejectTitle.textContent = isExecutedInvalid
            ? 'AI 설명 수용 불가: AI가 이미 실행했다고 답한 설명은 쓸 수 없습니다.'
            : 'AI 설명 수용 불가: 근거가 맞지 않음 (근거 ID가 event.evidence에 존재하지 않거나 부족합니다).';
          rejectBox.appendChild(rejectTitle);

          const rejectCode = document.createElement('p');
          rejectCode.className = 'muted';
          rejectCode.textContent = '오류 코드: ON_AI_INVALID_OUTPUT · 내용을 임의로 지어내지 않고 설명을 거절했습니다. 기록은 그대로입니다.';
          rejectBox.appendChild(rejectCode);

          container.appendChild(rejectBox);
          return container;
        }

        // 성공한 경우에만 data-student-explanation-event 속성 부여
        container.setAttribute('data-student-explanation-event', event.id || '');

        // 1) 사건 ID, AI 설명 제목(참고용) 및 요약
        const headerEl = document.createElement('div');
        headerEl.className = 'student-explanation-header';

        const titleEl = document.createElement('h3');
        titleEl.textContent = `사건 ${event.id || '확인 불가'} — AI 설명(참고용)`;
        headerEl.appendChild(titleEl);

        const summaryBox = document.createElement('div');
        summaryBox.className = 'student-explanation-summary-box';
        const summaryLabel = document.createElement('strong');
        summaryLabel.textContent = 'AI 요약: ';
        summaryBox.appendChild(summaryLabel);
        const summaryText = document.createElement('span');
        summaryText.textContent = data.summary || '요약 없음';
        summaryBox.appendChild(summaryText);
        headerEl.appendChild(summaryBox);

        if (checkedAt) {
          const timeEl = document.createElement('p');
          timeEl.className = 'student-explanation-time muted';
          timeEl.textContent = `점검 시각: ${checkedAt}`;
          headerEl.appendChild(timeEl);
        }

        container.appendChild(headerEl);

        // 2) evidenceIds 마다 event.evidence에서 같은 id를 찾아 "근거 ID — 근거 글"
        const evidenceSection = document.createElement('section');
        evidenceSection.className = 'student-explanation-section';
        const evidenceTitle = document.createElement('h4');
        evidenceTitle.textContent = '인용한 근거 (evidence)';
        evidenceSection.appendChild(evidenceTitle);

        const evidenceUl = document.createElement('ul');
        evidenceUl.className = 'student-explanation-evidence-list';
        evidenceIds.forEach((evId) => {
          const li = document.createElement('li');
          const evText = evidenceMap.get(evId) || '근거 글 없음';
          li.textContent = `${evId} — ${evText}`;
          evidenceUl.appendChild(li);
        });
        evidenceSection.appendChild(evidenceUl);
        container.appendChild(evidenceSection);

        // 3) event.rules 마다 "규칙 ID — 규칙 글" (id와 text를 함께)
        const rulesSection = document.createElement('section');
        rulesSection.className = 'student-explanation-section';
        const rulesTitle = document.createElement('h4');
        rulesTitle.textContent = '적용 규칙 (rules)';
        rulesSection.appendChild(rulesTitle);

        const eventRulesList = Array.isArray(event.rules) ? event.rules : [];
        if (eventRulesList.length === 0) {
          const noRules = document.createElement('p');
          noRules.className = 'muted';
          noRules.textContent = '적용된 규칙 없음';
          rulesSection.appendChild(noRules);
        } else {
          const rulesUl = document.createElement('ul');
          rulesUl.className = 'student-explanation-rules-list';
          eventRulesList.forEach((rule) => {
            const li = document.createElement('li');
            li.textContent = `${rule.id || '확인 불가'} — ${rule.text || '규칙 설명 없음'}`;
            rulesUl.appendChild(li);
          });
          rulesSection.appendChild(rulesUl);
        }
        container.appendChild(rulesSection);

        // 4) event.state에서 unknown인 항목을 접속·세션·기기별로 나눠 확인 불가 및 원래 값(unknown) 나열
        const stateSection = document.createElement('section');
        stateSection.className = 'student-explanation-section';
        const stateTitle = document.createElement('h4');
        stateTitle.textContent = '확인 불가 상태 (unknown)';
        stateSection.appendChild(stateTitle);

        const evState = event.state || {};
        const unknownEntries = [];
        if (evState.access === 'unknown') {
          unknownEntries.push('접속: 확인 불가(unknown)');
        }
        if (evState.session === 'unknown') {
          unknownEntries.push('세션: 확인 불가(unknown)');
        }
        if (evState.device === 'unknown') {
          unknownEntries.push('기기: 확인 불가(unknown)');
        }

        if (unknownEntries.length === 0) {
          const noUnknown = document.createElement('p');
          noUnknown.className = 'muted';
          noUnknown.textContent = '확인 불가 상태: 없음 (모든 상태 확인됨)';
          stateSection.appendChild(noUnknown);
        } else {
          const stateNotice = document.createElement('p');
          stateNotice.className = 'status-warning';
          stateNotice.textContent = '아래 상태는 서버가 알지 못하는 확인 불가 상태이며 정상이나 안전으로 판단하지 않습니다.';
          stateSection.appendChild(stateNotice);

          const stateUl = document.createElement('ul');
          unknownEntries.forEach((entryText) => {
            const li = document.createElement('li');
            li.textContent = entryText;
            stateUl.appendChild(li);
          });
          stateSection.appendChild(stateUl);
        }
        container.appendChild(stateSection);

        // 5) proposals 처리
        const proposalsSection = document.createElement('section');
        proposalsSection.className = 'student-explanation-section';
        const proposalsTitle = document.createElement('h4');
        proposalsTitle.textContent = 'AI 조치 제안 (proposals)';
        proposalsSection.appendChild(proposalsTitle);

        const proposalsList = Array.isArray(data.proposals) ? data.proposals : [];
        const supportedActions = Array.isArray(event.supportedActions) ? event.supportedActions : [];

        if (proposalsList.length === 0) {
          const emptyProposal = document.createElement('p');
          emptyProposal.className = 'muted';
          if (supportedActions.length === 0) {
            emptyProposal.textContent = '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).';
          } else {
            emptyProposal.textContent = 'AI가 제안한 조치가 없습니다.';
          }
          proposalsSection.appendChild(emptyProposal);
        } else {
          // 6) proposals가 있는 경우: 각 action과 reason, 사람 확인 필요 및 미실행 상태 명시
          const cautionNotice = document.createElement('p');
          cautionNotice.className = 'status-warning';
          cautionNotice.textContent = '사람 확인이 필요하며 실행되지 않았습니다. (AI 설명 및 제안만으로 보안 조치가 자동 실행되지 않습니다.)';
          proposalsSection.appendChild(cautionNotice);

          const proposalsUl = document.createElement('ul');
          proposalsList.forEach((prop) => {
            const li = document.createElement('li');
            const actName = prop.action || '조치 확인 불가';
            const actReason = prop.reason || '사유 없음';
            li.textContent = `조치 제안: ${actName} — 사유: ${actReason} (상태: 미실행 / 사람 확인 대기)`;
            proposalsUl.appendChild(li);
          });
          proposalsSection.appendChild(proposalsUl);
        }
        container.appendChild(proposalsSection);

        return container;
      }

      // 알 수 없는 상태
      container.removeAttribute('data-student-explanation-event');
      const fallback = document.createElement('p');
      fallback.className = 'muted';
      fallback.textContent = '확인 불가';
      container.appendChild(fallback);
      return container;
    },
    renderAction(context = {}) {
      const {
        status = 'idle',
        event,
        actionId,
        target,
        receipt,
        observation,
        message,
        confirmationExpiresAt,
        error,
      } = context || {};

      const container = document.createElement('div');
      container.className = 'student-action-container';

      // 1. 성공적으로 그린 경우 바깥 요소에 data-student-action-event, data-student-action-request 부여
      // 단, event나 receipt.requestId가 있을 때 부여
      if (event?.id) {
        container.setAttribute('data-student-action-event', event.id);
      }
      if (receipt?.requestId) {
        container.setAttribute('data-student-action-request', receipt.requestId);
      }

      // 2. 상태별 안내 문구 구성
      const statusBox = document.createElement('div');
      statusBox.className = 'student-action-status-box';

      const statusTitle = document.createElement('h3');
      statusTitle.className = 'student-action-status-title';

      const statusDesc = document.createElement('p');
      statusDesc.className = 'student-action-status-desc';

      if (status === 'idle') {
        statusTitle.textContent = '조치 상태: 아직 미실행(idle)';
        statusDesc.textContent = '현재 실행 대기 중이거나 진행 중인 조치가 없습니다. 아직 아무것도 실행하지 않았습니다.';
      } else if (status === 'loading') {
        statusTitle.textContent = '조치 상태: 조치 준비 또는 결과 조회 중(loading)';
        statusDesc.textContent = '원천 시스템에 조치를 준비하거나 처리 결과를 조회하는 중입니다. (완료 아님)';
      } else if (status === 'prepared') {
        statusTitle.textContent = '조치 상태: 준비됨·미실행(prepared)';
        const expireText = confirmationExpiresAt ? ` (사람 확인 기한: ${confirmationExpiresAt})` : '';
        statusDesc.textContent = `조치가 준비되었으나 아직 실행되지 않았습니다. 사람 확인이 필요하며${expireText} 제공 화면의 확인 버튼을 눌러야 집행됩니다.`;
      } else if (status === 'executing') {
        statusTitle.textContent = '조치 상태: 서버에 전달 중(executing)';
        statusDesc.textContent = '사람 확인 후 원천 서버에 조치 요청을 전달 중입니다. 결과가 아직 확인되지 않았으며 완료되지 않았습니다.';
      } else if (status === 'pending') {
        statusTitle.textContent = '조치 상태: 서버 접수·처리 중(pending)';
        statusDesc.textContent = '서버가 조치 요청을 접수하여 처리 중입니다. 서버가 요청을 받았다는 접수 응답(ACK)은 조치 성공이나 효과 완료가 아닙니다.';
      } else if (status === 'succeeded') {
        if (observation?.effectApplied === true) {
          statusTitle.textContent = '조치 상태: 효과 확인(succeeded)';
          statusTitle.className = 'student-action-status-title status-success';
          const obsTime = observation.observedAt || '확인 시각 없음';
          statusDesc.textContent = `원천 시스템에서 실제 보안 조치 효과가 확인되었습니다. [관측 시각: ${obsTime}, effectApplied: true]`;
        } else {
          statusTitle.textContent = '조치 상태: 결과 불명(unknown) · effectApplied 미확인';
          statusTitle.className = 'student-action-status-title status-warning';
          statusDesc.textContent = '서버 응답은 성공으로 수신되었으나 실제 원천 시스템의 효과(effectApplied: true)가 확인되지 않았습니다. 성공 또는 효과 없음으로 단정하지 마세요.';
        }
      } else if (status === 'denied') {
        statusTitle.textContent = '조치 상태: 거절(denied)';
        statusTitle.className = 'student-action-status-title status-danger';
        statusDesc.textContent = `원천 정책 또는 권한 기준에 따라 조치가 거절되었습니다. ${message || ''}`;
      } else if (status === 'failed') {
        statusTitle.textContent = '조치 상태: 실패(failed)';
        statusTitle.className = 'student-action-status-title status-danger';
        statusDesc.textContent = `원천 시스템에서 조치 실행에 실패했습니다. ${message || ''}`;
      } else if (status === 'unknown') {
        statusTitle.textContent = '조치 상태: 결과 불명(unknown)';
        statusTitle.className = 'student-action-status-title status-warning';
        statusDesc.textContent = '조치 처리 결과를 확인할 수 없습니다. 효과 없음으로도 성공으로도 판단하지 마시고 제공 화면에서 결과만 다시 조회하세요.';
      } else if (status === 'expired') {
        statusTitle.textContent = '조치 상태: 확인 기한 지남(expired)';
        statusTitle.className = 'student-action-status-title status-warning';
        statusDesc.textContent = '사람 확인 기한이 지났습니다. 이번 준비로는 집행할 수 없으므로 조치를 다시 준비하세요.';
      } else if (status === 'error') {
        statusTitle.textContent = '조치 상태: 요청 처리 안 됨(error)';
        statusTitle.className = 'student-action-status-title status-danger';
        const errCode = error?.code ? `[${error.code}] ` : '';
        const errMsg = error?.message || message || '요청 처리 중 오류가 발생했습니다.';
        statusDesc.textContent = `${errCode}${errMsg}`;
      } else {
        statusTitle.textContent = `조치 상태: ${status}`;
        statusDesc.textContent = message || '조치 상태를 확인 중입니다.';
      }

      statusBox.appendChild(statusTitle);
      statusBox.appendChild(statusDesc);
      container.appendChild(statusBox);

      // 3. 사건, 근거, 조치, 대상, 영수증, 관측 정보 표시 (있는 것만 나열)
      const dl = document.createElement('dl');
      dl.className = 'kv student-action-kv';

      // 현재 사건 ID
      if (event?.id) {
        const dt = document.createElement('dt');
        dt.textContent = '사건 ID';
        const dd = document.createElement('dd');
        dd.textContent = event.id;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 근거 ID 목록
      const evList = Array.isArray(event?.evidence) ? event.evidence : [];
      if (evList.length > 0) {
        const dt = document.createElement('dt');
        dt.textContent = '근거 ID';
        const dd = document.createElement('dd');
        dd.textContent = evList.map((e) => e.id).filter(Boolean).join(', ');
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 조치 ID
      if (actionId) {
        const dt = document.createElement('dt');
        dt.textContent = '조치 ID (actionId)';
        const dd = document.createElement('dd');
        dd.textContent = actionId;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 실제 대상 (target.id, target.generation)
      if (target?.id) {
        const dt = document.createElement('dt');
        dt.textContent = '실제 원천 대상';
        const dd = document.createElement('dd');
        const genText = (target.generation !== undefined && target.generation !== null)
          ? ` (세대: ${target.generation})`
          : '';
        dd.textContent = `${target.id}${genText}`;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 확인 기한 (confirmationExpiresAt)
      if (confirmationExpiresAt) {
        const dt = document.createElement('dt');
        dt.textContent = '확인 기한';
        const dd = document.createElement('dd');
        dd.textContent = confirmationExpiresAt;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 요청 ID (receipt.requestId)
      if (receipt?.requestId) {
        const dt = document.createElement('dt');
        dt.textContent = '요청 ID (requestId)';
        const dd = document.createElement('dd');
        dd.textContent = receipt.requestId;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 영수증 ID (receipt.receiptId)
      if (receipt?.receiptId) {
        const dt = document.createElement('dt');
        dt.textContent = '영수증 ID (receiptId)';
        const dd = document.createElement('dd');
        dd.textContent = receipt.receiptId;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 버전 (receipt.version)
      if (receipt?.version !== undefined && receipt?.version !== null) {
        const dt = document.createElement('dt');
        dt.textContent = '버전 (version)';
        const dd = document.createElement('dd');
        dd.textContent = String(receipt.version);
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 관측 결과 (observation)
      if (observation) {
        const dt = document.createElement('dt');
        dt.textContent = '원천 관측 결과';
        const dd = document.createElement('dd');
        const appliedStr = observation.effectApplied === true ? 'true (효과 적용됨)' : 'false (효과 미적용)';
        const timeStr = observation.observedAt ? ` / 관측 시각: ${observation.observedAt}` : '';
        dd.textContent = `effectApplied: ${appliedStr}${timeStr}`;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      if (dl.children.length > 0) {
        container.appendChild(dl);
      }

      // 지원 조치가 없는 경우 또는 안내 문구
      const supportedActions = Array.isArray(event?.supportedActions) ? event.supportedActions : [];
      if (supportedActions.length === 0) {
        const supportNotice = document.createElement('p');
        supportNotice.className = 'muted';
        supportNotice.textContent = '현재 사건에는 연동 시스템이 지원하는 조치가 없어(supportedActions 빈 목록) 조치 준비가 비활성화된 상태가 정상입니다.';
        container.appendChild(supportNotice);
      }

      const guideNotice = document.createElement('p');
      guideNotice.className = 'muted';
      guideNotice.textContent = '조치 집행 및 결과 재조회는 제공 화면의 버튼을 사용하세요. (학생 코드는 요청 버튼이나 확인 티켓을 임의로 생성하지 않습니다.)';
      container.appendChild(guideNotice);

      return container;
    },
  };
}
