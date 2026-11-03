from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.permissions import IsStudent

from .llm import ACTIVE_ATTEMPT_REPLY, get_chat_reply
from .models import ChatMessage, ChatSession
from .serializers import ChatRequestSerializer
from .tools import has_active_attempt


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'chat'

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.validated_data['message']

        session = None
        session_id = serializer.validated_data.get('session_id')
        if session_id:
            session = ChatSession.objects.filter(
                id=session_id,
                user=request.user,
            ).first()
        if session is None:
            session = ChatSession.objects.create(user=request.user)

        user_message = ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.USER,
            content=message,
        )

        if has_active_attempt(request.user):
            reply = ACTIVE_ATTEMPT_REPLY
        else:
            history = list(
                session.messages.exclude(pk=user_message.pk)
                .order_by('-created_at', '-pk')[:8]
            )
            history.reverse()
            history = [
                {'role': item.role, 'content': item.content}
                for item in history[-8:]
            ]
            reply = get_chat_reply(request.user, history, message)

        ChatMessage.objects.create(
            session=session,
            role=ChatMessage.Role.ASSISTANT,
            content=reply,
        )
        return Response({
            'reply': reply,
            'session_id': str(session.id),
        })
