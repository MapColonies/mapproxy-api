{{/*
Create service name as used by the service name label.
*/}}
{{- define "service.fullname" -}}
{{- printf "%s-%s-%s" .Release.Name .Chart.Name "service" | indent 1 }}
{{- end }}

{{/*
Create configmap name as used by the service name label.
*/}}
{{- define "configmap.fullname" -}}
{{- printf "%s-%s-%s" .Release.Name .Chart.Name "configmap" | indent 1 }}
{{- end }}

{{/*
Create deployment name as used by the service name label.
*/}}
{{- define "deployment.fullname" -}}
{{- printf "%s-%s-%s" .Release.Name .Chart.Name "deployment" | indent 1 }}
{{- end }}

{{/*
Create route name as used by the service name label.
*/}}
{{- define "route.fullname" -}}
{{- printf "%s-%s-%s" .Release.Name .Chart.Name "route" | indent 1 }}
{{- end }}

{{/*
Create ingress name as used by the service name label.
*/}}
{{- define "ingress.fullname" -}}
{{- printf "%s-%s-%s" .Release.Name .Chart.Name "ingress" | indent 1 }}
{{- end }}

{{/*
Returns the full ingress host.
*/}}
{{- define "ingress.host" -}}
{{- if .Values.ingress.host }}
    {{- .Values.ingress.host -}}
{{- else -}}
{{- printf "%s-%s.%s" .Release.Name .Chart.Name .Values.global.ingress.domain | indent 1 }}
{{- end -}}
{{- end -}}
